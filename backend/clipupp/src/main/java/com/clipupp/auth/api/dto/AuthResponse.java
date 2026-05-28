package com.clipupp.auth.api.dto;

public record AuthResponse(String accessToken, long accessTokenTtlSeconds, UserSummary user) {}
