package com.clipupp.auth.application;

import com.clipupp.auth.domain.RefreshToken;
import com.clipupp.auth.domain.Role;
import com.clipupp.auth.infra.JwtIssuer;
import com.clipupp.auth.infra.RefreshTokenRepository;
import com.clipupp.common.audit.AuditLogService;
import com.clipupp.common.config.JwtProperties;
import com.clipupp.common.error.ApiException;
import com.clipupp.common.error.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrates JWT issue + opaque refresh-token rotation with replay detection.
 *
 * <p>Each successful login (or refresh, or OAuth callback) calls
 * {@link #issuePair(UUID, Set, String, HttpServletRequest)} which returns the
 * pair of (access JWT, opaque refresh token plaintext). The plaintext is set
 * as a cookie by the controller and never persisted server-side; we only
 * keep its SHA-256 hash.
 *
 * <p>{@link #rotate(String, HttpServletRequest)} consumes a presented
 * refresh token: if the token is unknown or expired, 401. If the token has
 * already been {@code used_at}, treat as compromised — revoke every token in
 * the user's chain, audit, and 401. Otherwise mark used + issue a fresh pair
 * with {@code parent_id} pointing at the old row.
 */
@Service
public class TokenService {

    private static final Logger log = LoggerFactory.getLogger(TokenService.class);

    private final JwtIssuer jwtIssuer;
    private final RefreshTokenRepository refreshRepo;
    private final JwtProperties props;
    private final AuditLogService audit;

    public TokenService(JwtIssuer jwtIssuer, RefreshTokenRepository refreshRepo,
                        JwtProperties props, AuditLogService audit) {
        this.jwtIssuer = jwtIssuer;
        this.refreshRepo = refreshRepo;
        this.props = props;
        this.audit = audit;
    }

    public record TokenPair(String accessToken, long accessTokenTtlSeconds,
                            String refreshToken, OffsetDateTime refreshExpiresAt) {}

    /** Issue a new access token without touching the refresh-token chain. */
    public String issueAccessOnly(UUID userId, Set<Role> roles, String locale) {
        return jwtIssuer.issueAccessToken(userId, roles, locale);
    }

    public long accessTokenTtlSeconds() {
        return jwtIssuer.accessTokenTtlSeconds();
    }

    @Transactional
    public TokenPair issuePair(UUID userId, Set<Role> roles, String locale, HttpServletRequest req) {
        return issuePair(userId, roles, locale, null, req);
    }

    @Transactional
    public TokenPair issuePair(UUID userId, Set<Role> roles, String locale, UUID parentId,
                               HttpServletRequest req) {
        String access = jwtIssuer.issueAccessToken(userId, roles, locale);
        String refresh = SecureTokens.generate();
        OffsetDateTime expiresAt = OffsetDateTime.now()
                .plus(Duration.ofSeconds(props.refreshTokenTtlSeconds()));
        RefreshToken row = RefreshToken.issue(
                userId,
                SecureTokens.hash(refresh),
                parentId,
                req == null ? null : req.getHeader("User-Agent"),
                req == null ? null : req.getRemoteAddr(),
                expiresAt);
        refreshRepo.save(row);
        return new TokenPair(access, jwtIssuer.accessTokenTtlSeconds(), refresh, expiresAt);
    }

    @Transactional
    public RotationResult rotate(String presentedRefresh, HttpServletRequest req) {
        if (presentedRefresh == null || presentedRefresh.isBlank()) {
            throw ApiException.unauthorized("Missing refresh token");
        }
        byte[] hash = SecureTokens.hash(presentedRefresh);
        RefreshToken row = refreshRepo.findByTokenHash(hash)
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));

        if (row.isUsed()) {
            // Replay attack signature: a previously-consumed token is being presented again.
            // Revoke every refresh token for this user; force re-login on every device.
            int revoked = refreshRepo.revokeAllForUser(row.getUserId());
            audit.record(row.getUserId(), "AUTH_REFRESH_REPLAY", "user", row.getUserId(),
                    Map.of("revokedCount", revoked, "tokenId", row.getId().toString()));
            log.warn("Refresh-token replay detected userId={} revokedCount={}", row.getUserId(), revoked);
            throw ApiException.unauthorized("Session compromised; please sign in again");
        }
        if (row.isRevoked() || row.isExpired()) {
            throw ApiException.unauthorized("Refresh token expired");
        }

        row.markUsed();
        return new RotationResult(row.getUserId(), row.getId());
    }

    public record RotationResult(UUID userId, UUID parentTokenId) {}

    /**
     * Read-only validation used by SSR session checks. Looks up the token,
     * verifies it's still valid (not used, not revoked, not expired), and
     * returns the user id WITHOUT rotating. This avoids the rotation-replay
     * problem that would otherwise plague every server-rendered page hit
     * (each page would burn one token, and the browser would never see the
     * rotation, so the next render would look like a replay attack).
     */
    @Transactional(readOnly = true)
    public UUID validateRefreshWithoutRotating(String presentedRefresh) {
        if (presentedRefresh == null || presentedRefresh.isBlank()) {
            throw ApiException.unauthorized("Missing refresh token");
        }
        byte[] hash = SecureTokens.hash(presentedRefresh);
        RefreshToken row = refreshRepo.findByTokenHash(hash)
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));
        if (row.isUsed() || row.isRevoked() || row.isExpired()) {
            throw ApiException.unauthorized("Session expired; please sign in again");
        }
        return row.getUserId();
    }

    @Transactional
    public void revokeByPlaintext(String presentedRefresh) {
        if (presentedRefresh == null || presentedRefresh.isBlank()) return;
        refreshRepo.findByTokenHash(SecureTokens.hash(presentedRefresh))
                .filter(t -> !t.isRevoked())
                .ifPresent(RefreshToken::revoke);
    }

    @Transactional
    public int revokeAllForUser(UUID userId) {
        return refreshRepo.revokeAllForUser(userId);
    }

    /** Helper for callers that want to throw a clean error code. */
    public static ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "Invalid email or password");
    }
}
