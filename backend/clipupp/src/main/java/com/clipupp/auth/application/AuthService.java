package com.clipupp.auth.application;

import com.clipupp.auth.domain.EmailVerificationToken;
import com.clipupp.auth.domain.OAuthAccount;
import com.clipupp.auth.domain.PasswordResetToken;
import com.clipupp.auth.domain.Role;
import com.clipupp.auth.domain.UserStatus;
import com.clipupp.auth.infra.EmailVerificationTokenRepository;
import com.clipupp.auth.infra.OAuthAccountRepository;
import com.clipupp.auth.infra.PasswordResetTokenRepository;
import com.clipupp.common.audit.AuditLogService;
import com.clipupp.common.error.ApiException;
import com.clipupp.common.error.ErrorCode;
import com.clipupp.common.outbox.OutboxService;
import com.clipupp.notifications.application.EmailDispatcher;
import com.clipupp.users.domain.AppUser;
import com.clipupp.users.domain.UserPreference;
import com.clipupp.users.infra.AppUserRepository;
import com.clipupp.users.infra.UserPreferenceRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The auth-domain orchestrator. Encapsulates the seven public flows:
 * register, login, refresh, logout, verify-email (+ resend), forgot-password,
 * reset-password.
 *
 * <p>Side effects (email send, audit log, token rotation) are emitted via the
 * application/outbox layer so the caller's transaction stays small and atomic.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final int LOCKOUT_THRESHOLD = 5;
    private static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);
    private static final Duration EVT_TTL = Duration.ofHours(24);
    private static final Duration PRT_TTL = Duration.ofHours(1);

    private final AppUserRepository userRepo;
    private final UserPreferenceRepository prefRepo;
    private final EmailVerificationTokenRepository evtRepo;
    private final PasswordResetTokenRepository prtRepo;
    private final OAuthAccountRepository oauthRepo;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final TokenService tokenService;
    private final OutboxService outbox;
    private final AuditLogService audit;
    private final String publicSiteUrl;

    public AuthService(AppUserRepository userRepo,
                       UserPreferenceRepository prefRepo,
                       EmailVerificationTokenRepository evtRepo,
                       PasswordResetTokenRepository prtRepo,
                       OAuthAccountRepository oauthRepo,
                       PasswordEncoder passwordEncoder,
                       PasswordPolicy passwordPolicy,
                       TokenService tokenService,
                       OutboxService outbox,
                       AuditLogService audit,
                       @Value("${clipupp.public-site-url:http://localhost:3000}") String publicSiteUrl) {
        this.userRepo = userRepo;
        this.prefRepo = prefRepo;
        this.evtRepo = evtRepo;
        this.prtRepo = prtRepo;
        this.oauthRepo = oauthRepo;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.tokenService = tokenService;
        this.outbox = outbox;
        this.audit = audit;
        this.publicSiteUrl = publicSiteUrl;
    }

    // ---- register ----------------------------------------------------------
    @Transactional
    public AppUser register(String email, String password, String name, String locale) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        passwordPolicy.validate(password, normalizedEmail);
        if (userRepo.existsByEmail(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_TAKEN", "Email is already registered");
        }
        AppUser user = AppUser.create(normalizedEmail, passwordEncoder.encode(password), name,
                locale == null || locale.isBlank() ? "en" : locale);
        userRepo.save(user);
        prefRepo.save(new UserPreference(user.getId()));

        issueEmailVerification(user);
        audit.record(user.getId(), "USER_REGISTERED", "user", user.getId(),
                Map.of("email", normalizedEmail));
        return user;
    }

    // ---- login -------------------------------------------------------------
    @Transactional
    public LoginResult login(String email, String password, HttpServletRequest req) {
        String normalized = email == null ? "" : email.trim().toLowerCase();
        Optional<AppUser> maybe = userRepo.findByEmail(normalized);
        if (maybe.isEmpty()) {
            // Constant-time-ish behavior: still hash a dummy to mitigate user-enum timing
            passwordEncoder.matches(password == null ? "" : password,
                    "$2a$12$abcdefghijklmnopqrstuuFsB1XJsCqzz7bP9V0vjE7y/V.f6vN3YO");
            throw TokenService.invalidCredentials();
        }
        AppUser user = maybe.get();
        if (user.getStatus() != com.clipupp.auth.domain.UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is not active");
        }
        if (user.isLocked()) {
            throw new ApiException(HttpStatus.LOCKED, "ACCOUNT_LOCKED",
                    "Account is temporarily locked due to repeated failed sign-ins");
        }
        if (user.getPasswordHash() == null) {
            // OAuth-only user trying email/password
            throw new ApiException(HttpStatus.UNAUTHORIZED, "PASSWORD_NOT_SET",
                    "This account uses social sign-in. Use \"Continue with Google\" instead.");
        }
        if (!passwordEncoder.matches(password == null ? "" : password, user.getPasswordHash())) {
            user.recordFailedLogin(LOCKOUT_THRESHOLD, LOCKOUT_DURATION);
            audit.record(user.getId(), "AUTH_LOGIN_FAILED", "user", user.getId(),
                    Map.of("email", normalized, "failedCount", user.getFailedLoginCount()));
            throw TokenService.invalidCredentials();
        }
        user.recordSuccessfulLogin();
        TokenService.TokenPair pair = tokenService.issuePair(user.getId(), user.getRoles(), user.getLocale(), req);
        audit.record(user.getId(), "AUTH_LOGIN", "user", user.getId(), Map.of("email", normalized));
        return new LoginResult(user, pair);
    }

    public record LoginResult(AppUser user, TokenService.TokenPair tokens) {}

    /**
     * Non-rotating session check for server components. Validates the
     * presented refresh token and returns the user.
     */
    @Transactional(readOnly = true)
    public AppUser whoami(String presentedRefresh) {
        UUID userId = tokenService.validateRefreshWithoutRotating(presentedRefresh);
        return userRepo.findById(userId)
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> ApiException.unauthorized("User no longer exists"));
    }

    // ---- refresh -----------------------------------------------------------

    /**
     * Issue a new access token from the presented refresh cookie. WITHOUT
     * rotating the refresh token. Refresh is now idempotent — the same
     * clipupp_rt cookie value works any number of times until logout or expiry.
     *
     * <p>Rotation was creating brittle race conditions in the SPA: any two
     * concurrent 401 retries (apiClient + mediaApi + AuthProvider hydrate)
     * could hit /refresh in parallel, the second one would present the
     * already-used token, and replay-detection would revoke the whole
     * session. With HttpOnly + SameSite=Lax + same-origin proxy + short TTL
     * the risk envelope is small enough to drop rotation for now.
     */
    @Transactional(readOnly = true)
    public RefreshResult refresh(String presentedRefresh, HttpServletRequest req) {
        UUID userId = tokenService.validateRefreshWithoutRotating(presentedRefresh);
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("User no longer exists"));
        if (user.getStatus() != com.clipupp.auth.domain.UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is not active");
        }
        String access = tokenService.issueAccessOnly(user.getId(), user.getRoles(), user.getLocale());
        return new RefreshResult(access, tokenService.accessTokenTtlSeconds());
    }

    public record RefreshResult(String accessToken, long accessTokenTtlSeconds) {}

    // ---- logout ------------------------------------------------------------
    @Transactional
    public void logout(String presentedRefresh, UUID userId) {
        if (presentedRefresh != null && !presentedRefresh.isBlank()) {
            tokenService.revokeByPlaintext(presentedRefresh);
        }
        if (userId != null) {
            audit.record(userId, "AUTH_LOGOUT", "user", userId, Map.of());
        }
    }

    // ---- email verification ------------------------------------------------
    @Transactional
    public void verifyEmail(String tokenPlaintext) {
        if (tokenPlaintext == null || tokenPlaintext.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ErrorCode.MALFORMED_REQUEST, "Missing token");
        }
        EmailVerificationToken row = evtRepo.findByTokenHash(SecureTokens.hash(tokenPlaintext))
                .orElseThrow(() -> new ApiException(HttpStatus.GONE, "TOKEN_INVALID", "Verification link is invalid"));
        if (!row.isValid()) {
            throw new ApiException(HttpStatus.GONE, "TOKEN_EXPIRED", "Verification link has expired");
        }
        AppUser user = userRepo.findById(row.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.GONE, "TOKEN_INVALID", "User no longer exists"));
        row.markUsed();
        evtRepo.invalidateAllForUser(user.getId());
        user.markEmailVerified();
        audit.record(user.getId(), "EMAIL_VERIFIED", "user", user.getId(), Map.of());
    }

    @Transactional
    public void resendVerification(String email) {
        // Always success-shaped — no enumeration leaks.
        userRepo.findByEmail(email == null ? "" : email.trim().toLowerCase())
                .filter(u -> !u.isEmailVerified())
                .ifPresent(this::issueEmailVerification);
    }

    private void issueEmailVerification(AppUser user) {
        evtRepo.invalidateAllForUser(user.getId());
        String tokenPlain = SecureTokens.generate();
        OffsetDateTime expiresAt = OffsetDateTime.now().plus(EVT_TTL);
        evtRepo.save(EmailVerificationToken.issue(user.getId(), SecureTokens.hash(tokenPlain), expiresAt));
        outbox.enqueue(EmailDispatcher.TOPIC, Map.of(
                "to", user.getEmail(),
                "locale", user.getLocale() == null ? "en" : user.getLocale(),
                "templateId", "verify-email",
                "model", Map.of(
                        "name", user.getName() == null ? "" : user.getName(),
                        "verifyUrl", publicSiteUrl + "/verify-email?token=" + tokenPlain,
                        "expiresHours", String.valueOf(EVT_TTL.toHours())
                )
        ));
    }

    // ---- forgot / reset password ------------------------------------------
    @Transactional
    public void forgotPassword(String email) {
        // Always 202: no leaks about whether email exists.
        userRepo.findByEmail(email == null ? "" : email.trim().toLowerCase())
                .filter(u -> u.getStatus() == com.clipupp.auth.domain.UserStatus.ACTIVE)
                .ifPresent(user -> {
                    prtRepo.invalidateAllForUser(user.getId());
                    String tokenPlain = SecureTokens.generate();
                    OffsetDateTime expiresAt = OffsetDateTime.now().plus(PRT_TTL);
                    prtRepo.save(PasswordResetToken.issue(user.getId(), SecureTokens.hash(tokenPlain), expiresAt));
                    outbox.enqueue(EmailDispatcher.TOPIC, Map.of(
                            "to", user.getEmail(),
                            "locale", user.getLocale() == null ? "en" : user.getLocale(),
                            "templateId", "password-reset",
                            "model", Map.of(
                                    "name", user.getName() == null ? "" : user.getName(),
                                    "resetUrl", publicSiteUrl + "/reset-password?token=" + tokenPlain,
                                    "expiresHours", String.valueOf(PRT_TTL.toHours())
                            )
                    ));
                    audit.record(user.getId(), "PASSWORD_RESET_REQUESTED", "user", user.getId(), Map.of());
                });
    }

    @Transactional
    public void resetPassword(String tokenPlaintext, String newPassword) {
        if (tokenPlaintext == null || tokenPlaintext.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ErrorCode.MALFORMED_REQUEST, "Missing token");
        }
        PasswordResetToken row = prtRepo.findByTokenHash(SecureTokens.hash(tokenPlaintext))
                .orElseThrow(() -> new ApiException(HttpStatus.GONE, "TOKEN_INVALID", "Reset link is invalid"));
        if (!row.isValid()) {
            throw new ApiException(HttpStatus.GONE, "TOKEN_EXPIRED", "Reset link has expired");
        }
        AppUser user = userRepo.findById(row.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.GONE, "TOKEN_INVALID", "User no longer exists"));
        passwordPolicy.validate(newPassword, user.getEmail());
        user.changePassword(passwordEncoder.encode(newPassword));
        row.markUsed();
        prtRepo.invalidateAllForUser(user.getId());
        // Force re-login on every device.
        tokenService.revokeAllForUser(user.getId());
        audit.record(user.getId(), "PASSWORD_RESET", "user", user.getId(), Map.of());
    }

    // ---- OAuth2 login / register ------------------------------------------
    @Transactional
    public LoginResult loginOrRegisterOAuth(String provider, String providerUserId,
                                             String email, String name, String imageUrl,
                                             HttpServletRequest req) {
        AppUser user;
        Optional<OAuthAccount> existing = oauthRepo.findByProviderAndProviderUserId(provider, providerUserId);
        if (existing.isPresent()) {
            user = userRepo.findById(existing.get().getUserId())
                    .orElseThrow(() -> ApiException.unauthorized("User not found"));
        } else {
            String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
            Optional<AppUser> byEmail = userRepo.findByEmail(normalizedEmail);
            if (byEmail.isPresent()) {
                user = byEmail.get();
            } else {
                user = AppUser.create(normalizedEmail, null, name, "en");
                user.markEmailVerified();
                userRepo.save(user);
                prefRepo.save(new UserPreference(user.getId()));
                audit.record(user.getId(), "USER_REGISTERED_OAUTH", "user", user.getId(),
                        Map.of("provider", provider, "email", normalizedEmail));
            }
            oauthRepo.save(OAuthAccount.link(user.getId(), provider, providerUserId, email));
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is not active");
        }
        if (name != null && user.getName() == null) user.setName(name);
        if (imageUrl != null && user.getImageUrl() == null) user.setImageUrl(imageUrl);

        user.recordSuccessfulLogin();
        TokenService.TokenPair pair = tokenService.issuePair(user.getId(), user.getRoles(), user.getLocale(), req);
        audit.record(user.getId(), "AUTH_LOGIN_OAUTH", "user", user.getId(), Map.of("provider", provider));
        return new LoginResult(user, pair);
    }

    // ---- change password (authenticated) -----------------------------------
    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Invalid session"));
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(currentPassword == null ? "" : currentPassword, user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CURRENT_PASSWORD",
                    "Current password is incorrect");
        }
        passwordPolicy.validate(newPassword, user.getEmail());
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw PasswordPolicy.reused();
        }
        user.changePassword(passwordEncoder.encode(newPassword));
        // Revoke all refresh tokens — user will be logged out everywhere except current call's chain.
        // The controller is responsible for issuing a fresh pair if needed.
        tokenService.revokeAllForUser(user.getId());
        audit.record(user.getId(), "PASSWORD_CHANGED", "user", user.getId(), Map.of());
    }
}
