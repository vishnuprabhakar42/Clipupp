package com.clipupp.clicktrack.application;

import java.io.Serializable;
import java.util.UUID;

/**
 * Denormalized payload for the {@code /r/{couponId}} hot path. We resolve
 * coupon → store → active merchant_network_link once and keep the result
 * in Caffeine, so the redirect is sub-5ms.
 */
public record CouponRedirectInfo(
        UUID couponId,
        UUID storeId,
        String storeName,
        UUID networkId,
        String networkCode,
        String advertiserId,
        String deeplinkTemplate,
        /** Effective merchant landing URL: coupon.affiliate_url_override falls back to store.primary_url. */
        String merchantUrl
) implements Serializable {}
