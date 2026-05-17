package com.couponvalley.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "couponvalley.jwt")
public record JwtProperties(
        String issuer,
        String audience,
        String secret,
        long accessTokenTtlSeconds,
        long refreshTokenTtlSeconds
) {}
