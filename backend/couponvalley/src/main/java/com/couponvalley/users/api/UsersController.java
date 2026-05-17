package com.couponvalley.users.api;

import com.couponvalley.auth.api.dto.ChangePasswordRequest;
import com.couponvalley.auth.api.dto.UserSummary;
import com.couponvalley.auth.application.AuthService;
import com.couponvalley.common.error.ApiException;
import com.couponvalley.users.api.dto.PreferenceResponse;
import com.couponvalley.users.api.dto.UpdatePreferencesRequest;
import com.couponvalley.users.api.dto.UpdateProfileRequest;
import com.couponvalley.users.application.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "users", description = "Authenticated user resources (current user only)")
public class UsersController {

    private final UserService userService;
    private final AuthService authService;

    public UsersController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user",
            description = "Returns the authenticated user's profile summary.")
    public UserSummary me(Authentication auth) {
        return UserSummary.from(userService.require(currentUserId(auth)));
    }

    @PatchMapping("/me")
    @Operation(summary = "Update profile (name, image, locale)")
    public UserSummary updateMe(Authentication auth, @RequestBody @Valid UpdateProfileRequest req) {
        return UserSummary.from(userService.updateProfile(
                currentUserId(auth), req.name(), req.imageUrl(), req.locale()));
    }

    @PatchMapping("/me/password")
    @Operation(summary = "Change password",
            description = "Requires current password. Revokes all existing refresh tokens.")
    public ResponseEntity<Void> changePassword(Authentication auth,
                                               @RequestBody @Valid ChangePasswordRequest req) {
        authService.changePassword(currentUserId(auth), req.currentPassword(), req.newPassword());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/preferences")
    @Operation(summary = "Get preferences")
    public PreferenceResponse preferences(Authentication auth) {
        return PreferenceResponse.from(userService.requirePreference(currentUserId(auth)));
    }

    @PatchMapping("/me/preferences")
    @Operation(summary = "Update preferences")
    public PreferenceResponse updatePreferences(Authentication auth,
                                                @RequestBody @Valid UpdatePreferencesRequest req) {
        return PreferenceResponse.from(userService.updatePreferences(
                currentUserId(auth),
                req.preferredCurrency(), req.emailOptIn(),
                req.weeklyDigestOptIn(), req.marketingOptIn()));
    }

    private static UUID currentUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw ApiException.unauthorized("Not authenticated");
        }
        try {
            return UUID.fromString(auth.getName());
        } catch (IllegalArgumentException ex) {
            throw ApiException.unauthorized("Invalid session");
        }
    }
}
