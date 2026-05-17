package com.couponvalley.users.api.dto;

import com.couponvalley.users.domain.UserPreference;

public record PreferenceResponse(
        String preferredCurrency,
        boolean emailOptIn,
        boolean weeklyDigestOptIn,
        boolean marketingOptIn
) {
    public static PreferenceResponse from(UserPreference p) {
        return new PreferenceResponse(
                p.getPreferredCurrency(),
                p.isEmailOptIn(),
                p.isWeeklyDigestOptIn(),
                p.isMarketingOptIn());
    }
}
