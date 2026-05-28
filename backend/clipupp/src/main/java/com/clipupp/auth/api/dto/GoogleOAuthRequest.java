package com.clipupp.auth.api.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleOAuthRequest(@NotBlank String idToken) {}
