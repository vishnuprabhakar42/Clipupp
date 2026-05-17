package com.couponvalley.coupons.api.dto;

import com.couponvalley.coupons.domain.Coupon;
import com.couponvalley.coupons.domain.CouponType;
import com.couponvalley.stores.domain.Store;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CouponSummary(
        UUID id,
        String slug,
        UUID storeId,
        String storeName,
        String storeSlug,
        String storeLogoUrl,
        String storeBrandColor,
        CouponType type,
        String code,
        String title,
        String description,
        String savingsLabel,
        OffsetDateTime expiresAt,
        boolean verified,
        boolean exclusive,
        int usedCount,
        int popularityScore,
        List<String> categorySlugs
) {
    /** Backwards-compatible factory used by endpoints that don't have store info handy. */
    public static CouponSummary from(Coupon c) {
        return from(c, null);
    }

    public static CouponSummary from(Coupon c, Store s) {
        return new CouponSummary(
                c.getId(), c.getSlug(), c.getStoreId(),
                s == null ? null : s.getName(),
                s == null ? null : s.getSlug(),
                s == null ? null : s.getLogoUrl(),
                s == null ? null : s.getBrandColor(),
                c.getType(), c.getCode(),
                c.getTitle(), c.getDescription(), c.getSavingsLabel(), c.getExpiresAt(),
                c.isVerified(), c.isExclusive(), c.getUsedCount(), c.getPopularityScore(),
                c.getCategories().stream().map(cat -> cat.getSlug()).toList());
    }
}
