package com.couponvalley.auth.api.dto;

import com.couponvalley.users.domain.AppUser;
import java.util.List;
import java.util.UUID;

public record UserSummary(
        UUID id,
        String email,
        boolean emailVerified,
        String name,
        String imageUrl,
        String locale,
        List<String> roles
) {
    public static UserSummary from(AppUser u) {
        return new UserSummary(
                u.getId(),
                u.getEmail(),
                u.isEmailVerified(),
                u.getName(),
                u.getImageUrl(),
                u.getLocale(),
                u.getRoles().stream().map(Enum::name).toList()
        );
    }
}
