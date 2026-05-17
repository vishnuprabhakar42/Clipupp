package com.couponvalley.stores.api.dto;

import com.couponvalley.stores.domain.Store;
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
        boolean featured
) {
    public static StoreSummary from(Store s) {
        return new StoreSummary(
                s.getId(), s.getSlug(), s.getName(), s.getLogoUrl(),
                s.getShortDescription(), s.getRating(), s.getReviewCount(),
                s.getCountryCode(), s.getPopularityScore(), s.getBrandColor(),
                s.getCashbackRate(), s.getPreviousCashbackRate(), s.getTagline(),
                s.isFeatured());
    }
}
