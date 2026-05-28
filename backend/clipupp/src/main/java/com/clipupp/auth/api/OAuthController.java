package com.clipupp.auth.api;

import com.clipupp.auth.api.dto.AuthResponse;
import com.clipupp.auth.api.dto.GoogleOAuthRequest;
import com.clipupp.auth.api.dto.UserSummary;
import com.clipupp.auth.application.AuthService;
import com.clipupp.auth.application.TokenService;
import com.clipupp.auth.infra.GoogleTokenVerifier;
import com.clipupp.users.domain.AppUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/oauth2")
@Tag(name = "auth", description = "Authentication and account-recovery endpoints")
@SecurityRequirements
public class OAuthController {

    private final AuthService authService;
    private final GoogleTokenVerifier googleVerifier;
    private final RefreshCookie refreshCookie;

    public OAuthController(AuthService authService, GoogleTokenVerifier googleVerifier,
                           RefreshCookie refreshCookie) {
        this.authService = authService;
        this.googleVerifier = googleVerifier;
        this.refreshCookie = refreshCookie;
    }

    @PostMapping("/google")
    @Operation(summary = "Sign in / register with Google",
            description = "Verifies a Google ID token (obtained client-side via Google Identity Services). " +
                    "Creates the account on first sign-in. Returns the same AuthResponse as email/password login.")
    public ResponseEntity<AuthResponse> google(@RequestBody @Valid GoogleOAuthRequest req,
                                               HttpServletRequest request,
                                               HttpServletResponse response) {
        GoogleTokenVerifier.GoogleTokenInfo info = googleVerifier.verify(req.idToken());
        AuthService.LoginResult result = authService.loginOrRegisterOAuth(
                "google", info.sub(), info.email(), info.name(), info.picture(), request);
        refreshCookie.set(response, result.tokens().refreshToken(), result.tokens().refreshExpiresAt());
        return ResponseEntity.ok(new AuthResponse(
                result.tokens().accessToken(),
                result.tokens().accessTokenTtlSeconds(),
                UserSummary.from(result.user())));
    }
}
