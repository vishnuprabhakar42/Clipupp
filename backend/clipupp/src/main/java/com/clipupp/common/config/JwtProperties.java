package com.clipupp.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "clipupp.jwt")
public record JwtProperties(
        String issuer,
        String audience,
        String secret,
        long accessTokenTtlSeconds,
        long refreshTokenTtlSeconds
) {}
