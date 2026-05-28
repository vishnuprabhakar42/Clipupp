package com.clipupp.home.api.dto;

import com.clipupp.coupons.api.dto.CouponSummary;
import com.clipupp.stores.api.dto.StoreSummary;
import java.util.List;

/**
 * Resolved public-facing homepage layout. Each enabled section has either a
 * list of typed items (stores / coupons / categories) inlined, or null if the
 * section's items live elsewhere (banners come from /banners; newsletter is
 * static; promo banners are loaded by their own component).
 */
public final class PublicHomepageDtos {

    private PublicHomepageDtos() {}

    public record CategoryItem(String slug, String title, String icon) {}

    public record HomepageSectionPayload(
            String code,
            String title,
            String subtitle,
            Integer itemLimit,
            List<StoreSummary> stores,
            List<CouponSummary> coupons,
            List<CategoryItem> categories
    ) {}

    public record HomepageLayout(List<HomepageSectionPayload> sections) {}
}
