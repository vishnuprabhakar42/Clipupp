package com.couponvalley.users.api.dto;

import jakarta.validation.constraints.Pattern;

public record UpdatePreferencesRequest(
        @Pattern(regexp = "^[A-Z]{3}$", message = "must be a 3-letter ISO 4217 code")
        String preferredCurrency,
        Boolean emailOptIn,
        Boolean weeklyDigestOptIn,
        Boolean marketingOptIn
) {}
