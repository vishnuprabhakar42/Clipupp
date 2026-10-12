package com.clipupp.stores.api.dto;

import com.clipupp.stores.domain.Store;
import java.math.BigDecimal;
import java.util.UUID;

public record StoreSummary(
        UUID id,
        String slug,
        String name,
        String logoUrl,
        String shortDescription,
        BigDecimal rating,
        int reviewCount,
        String countryCode,
        int popularityScore,
        String brandColor,
        String cashbackRate,
        String previousCashbackRate,
        String tagline,
        boolean featured,
        /** Active, unexpired coupons. Null when the endpoint did not compute it. */
        Integer activeCouponCount
) {
    public static StoreSummary from(Store s) {
        return new StoreSummary(
                s.getId(), s.getSlug(), s.getName(), s.getLogoUrl(),
                s.getShortDescription(), s.getRating(), s.getReviewCount(),
                s.getCountryCode(), s.getPopularityScore(), s.getBrandColor(),
                s.getCashbackRate(), s.getPreviousCashbackRate(), s.getTagline(),
                s.isFeatured(), null);
    }

    public StoreSummary withActiveCouponCount(int count) {
        return new StoreSummary(id, slug, name, logoUrl, shortDescription, rating, reviewCount,
                countryCode, popularityScore, brandColor, cashbackRate, previousCashbackRate,
                tagline, featured, count);
    }
}
