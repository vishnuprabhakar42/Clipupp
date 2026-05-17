package com.couponvalley.coupons.api.dto;

import com.couponvalley.coupons.application.CouponService;
import com.couponvalley.coupons.domain.Coupon;
import com.couponvalley.coupons.domain.CouponStatus;
import com.couponvalley.coupons.domain.CouponType;
import com.couponvalley.stores.domain.Store;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CouponDetailResponse(
        UUID id,
        String slug,
        CouponType type,
        CouponStatus status,
        String code,
        String title,
        String description,
        String terms,
        String savingsLabel,
        BigDecimal minPurchase,
        String minPurchaseCurrency,
        OffsetDateTime startsAt,
        OffsetDateTime expiresAt,
        boolean verified,
        boolean exclusive,
        int usedCount,
        int popularityScore,
        String metaTitle,
        String metaDescription,
        List<String> categorySlugs,
        StoreRef store
) {
    public static CouponDetailResponse from(CouponService.CouponDetail d) {
        Coupon c = d.coupon();
        return new CouponDetailResponse(
                c.getId(), c.getSlug(), c.getType(), c.getStatus(), c.getCode(),
                c.getTitle(), c.getDescription(), c.getTerms(), c.getSavingsLabel(),
                c.getMinPurchase(), c.getMinPurchaseCurrency(),
                c.getStartsAt(), c.getExpiresAt(),
                c.isVerified(), c.isExclusive(), c.getUsedCount(), c.getPopularityScore(),
                c.getMetaTitle(), c.getMetaDescription(),
                c.getCategories().stream().map(cat -> cat.getSlug()).toList(),
                d.store() == null ? null : StoreRef.from(d.store()));
    }

    public record StoreRef(UUID id, String slug, String name, String logoUrl, String primaryUrl) {
        public static StoreRef from(Store s) {
            return new StoreRef(s.getId(), s.getSlug(), s.getName(), s.getLogoUrl(), s.getPrimaryUrl());
        }
    }
}
