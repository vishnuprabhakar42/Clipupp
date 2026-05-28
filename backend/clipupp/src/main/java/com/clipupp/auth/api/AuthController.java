package com.clipupp.auth.api;

import com.clipupp.auth.api.dto.AuthResponse;
import com.clipupp.auth.api.dto.ForgotPasswordRequest;
import com.clipupp.auth.api.dto.LoginRequest;
import com.clipupp.auth.api.dto.RegisterRequest;
import com.clipupp.auth.api.dto.ResetPasswordRequest;
import com.clipupp.auth.api.dto.UserSummary;
import com.clipupp.auth.api.dto.VerifyEmailRequest;
import com.clipupp.auth.application.AuthService;
import com.clipupp.auth.application.TokenService;
import com.clipupp.users.domain.AppUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "auth", description = "Authentication and account-recovery endpoints")
@SecurityRequirements
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;
    private final RefreshCookie refreshCookie;

    public AuthController(AuthService authService, TokenService tokenService, RefreshCookie refreshCookie) {
        this.authService = authService;
        this.tokenService = tokenService;
        this.refreshCookie = refreshCookie;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new account",
            description = "Creates a user, sends verification email. Caller is NOT logged in until they verify.")
    public ResponseEntity<UserSummary> register(@RequestBody @Valid RegisterRequest req) {
        AppUser user = authService.register(req.email(), req.password(), req.name(), req.locale());
        return ResponseEntity.status(HttpStatus.CREATED).body(UserSummary.from(user));
    }

    @PostMapping("/login")
    @Operation(summary = "Sign in with email + password",
            description = "On success, sets the refresh cookie and returns the access token + user summary.")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest req,
                                              HttpServletRequest request,
                                              HttpServletResponse response) {
        AuthService.LoginResult result = authService.login(req.email(), req.password(), request);
        refreshCookie.set(response, result.tokens().refreshToken(), result.tokens().refreshExpiresAt());
        return ResponseEntity.ok(new AuthResponse(
                result.tokens().accessToken(),
                result.tokens().accessTokenTtlSeconds(),
                UserSummary.from(result.user())));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token (non-rotating)",
            description = "Reads the clipupp_rt cookie, validates it, returns a fresh access token. " +
                    "The refresh token is NOT rotated — the same cookie value works any number " +
                    "of times until logout or expiry.")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
        String presented = refreshCookie.read(request);
        AuthService.RefreshResult tok = authService.refresh(presented, request);
        return ResponseEntity.ok(new AuthResponse(tok.accessToken(), tok.accessTokenTtlSeconds(), null));
    }

    @org.springframework.web.bind.annotation.GetMapping("/whoami")
    @Operation(summary = "Read-only session check (no rotation)",
            description = "Validates the clipupp_rt cookie WITHOUT rotating and returns the user. " +
                    "Used by SSR session checks to avoid burning a refresh token on every page render.")
    public ResponseEntity<UserSummary> whoami(HttpServletRequest request) {
        String presented = refreshCookie.read(request);
        com.clipupp.users.domain.AppUser user = authService.whoami(presented);
        return ResponseEntity.ok(UserSummary.from(user));
    }

    @PostMapping("/logout")
    @Operation(summary = "Sign out", description = "Revokes the presented refresh token and clears the cookie.")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response,
                                       Authentication auth) {
        UUID userId = parseUserId(auth);
        authService.logout(refreshCookie.read(request), userId);
        refreshCookie.clear(response);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Confirm email", description = "Marks the email as verified given a valid token.")
    public ResponseEntity<Void> verify(@RequestBody @Valid VerifyEmailRequest req) {
        authService.verifyEmail(req.token());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification email")
    public ResponseEntity<Void> resend(@RequestBody @Valid ForgotPasswordRequest req) {
        authService.resendVerification(req.email());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset",
            description = "Always returns 202 — never reveals whether the email exists.")
    public ResponseEntity<Void> forgot(@RequestBody @Valid ForgotPasswordRequest req) {
        authService.forgotPassword(req.email());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Set a new password using a reset token",
            description = "On success, all existing refresh tokens are revoked.")
    public ResponseEntity<Void> reset(@RequestBody @Valid ResetPasswordRequest req) {
        authService.resetPassword(req.token(), req.newPassword());
        return ResponseEntity.noContent().build();
    }

    private static UUID parseUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        try { return UUID.fromString(auth.getName()); }
        catch (IllegalArgumentException ex) { return null; }
    }
}
