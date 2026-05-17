package com.couponvalley.stores.api.dto;

import com.couponvalley.stores.domain.Store;
import com.couponvalley.stores.domain.StoreStatus;
import com.couponvalley.stores.domain.StoreTopOffer;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Full editable view of a store. Returned to admins from GET /api/v1/admin/stores/{id}
 * — round-trips cleanly with {@link StoreInput.Update} so an edit form can hydrate
 * its defaults from the same shape it submits.
 */
public record StoreAdminDetail(
        UUID id,
        String slug,
        String name,
        String logoUrl,
        String description,
        String shortDescription,
        BigDecimal rating,
        int reviewCount,
        String phone,
        String address,
        String primaryUrl,
        String countryCode,
        StoreStatus status,
        int popularityScore,
        String brandColor,
        String cashbackRate,
        String previousCashbackRate,
        String tagline,
        boolean featured,
        String metaTitle,
        String metaDescription,
        List<String> topOffers,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime deletedAt
) {
    public static StoreAdminDetail from(Store s, List<StoreTopOffer> offers) {
        return new StoreAdminDetail(
                s.getId(), s.getSlug(), s.getName(), s.getLogoUrl(),
                s.getDescription(), s.getShortDescription(), s.getRating(), s.getReviewCount(),
                s.getPhone(), s.getAddress(), s.getPrimaryUrl(), s.getCountryCode(),
                s.getStatus(), s.getPopularityScore(),
                s.getBrandColor(), s.getCashbackRate(), s.getPreviousCashbackRate(),
                s.getTagline(), s.isFeatured(),
                s.getMetaTitle(), s.getMetaDescription(),
                offers == null ? List.of() : offers.stream().map(StoreTopOffer::getText).toList(),
                s.getCreatedAt(), s.getUpdatedAt(), s.getDeletedAt());
    }
}
