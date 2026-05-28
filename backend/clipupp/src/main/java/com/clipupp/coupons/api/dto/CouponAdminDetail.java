package com.clipupp.coupons.api.dto;

import com.clipupp.coupons.domain.Coupon;
import com.clipupp.coupons.domain.CouponStatus;
import com.clipupp.coupons.domain.CouponType;
import com.clipupp.stores.domain.Store;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Full editable view of a coupon. Returned to admins from
 * GET /api/v1/admin/coupons/{id}. Round-trips with {@link CouponInput.Update}.
 */
public record CouponAdminDetail(
        UUID id,
        String slug,
        UUID storeId,
        String storeName,
        String storeSlug,
        CouponType type,
        String code,
        String title,
        String description,
        String terms,
        String savingsLabel,
        BigDecimal minPurchase,
        String minPurchaseCurrency,
        OffsetDateTime startsAt,
        OffsetDateTime expiresAt,
        CouponStatus status,
        boolean verified,
        boolean exclusive,
        int usedCount,
        int clickCount,
        int popularityScore,
        String affiliateUrlOverride,
        String metaTitle,
        String metaDescription,
        List<String> categorySlugs,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime deletedAt
) {
    public static CouponAdminDetail from(Coupon c, Store s) {
        return new CouponAdminDetail(
                c.getId(), c.getSlug(), c.getStoreId(),
                s == null ? null : s.getName(),
                s == null ? null : s.getSlug(),
                c.getType(), c.getCode(),
                c.getTitle(), c.getDescription(),
                c.getTerms(), c.getSavingsLabel(),
                c.getMinPurchase(), c.getMinPurchaseCurrency(),
                c.getStartsAt(), c.getExpiresAt(),
                c.getStatus(),
                c.isVerified(), c.isExclusive(),
                c.getUsedCount(), c.getClickCount(), c.getPopularityScore(),
                c.getAffiliateUrlOverride(), c.getMetaTitle(), c.getMetaDescription(),
                c.getCategories().stream().map(cat -> cat.getSlug()).toList(),
                c.getCreatedAt(), c.getUpdatedAt(), c.getDeletedAt());
    }
}
