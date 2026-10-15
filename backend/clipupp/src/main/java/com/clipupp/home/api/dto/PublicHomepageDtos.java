package com.clipupp.home.api.dto;

import com.clipupp.campaigns.api.dto.CampaignDtos;
import com.clipupp.coupons.api.dto.CouponSummary;
import com.clipupp.stores.api.dto.StoreSummary;
import java.util.List;

/**
 * Resolved public homepage in one payload. Each section carries only the
 * collections its renderer needs; everything else is null so the JSON stays
 * small. See HomepageResolver for which code fills which field.
 */
public final class PublicHomepageDtos {

    private PublicHomepageDtos() {}

    public record CategoryItem(String slug, String title, String icon) {}

    /** One tab of the "Today's top coupons" section. */
    public record CategoryTab(String slug, String title, List<CouponSummary> coupons) {}

    /** Live numbers for the hero proof line. */
    public record Stats(long verifiedLast7d, long activeCoupons, long activeStores) {}

    public record HomepageSectionPayload(
            String code,
            String title,
            String subtitle,
            Integer itemLimit,
            List<StoreSummary> stores,
            List<CouponSummary> coupons,
            List<CategoryItem> categories,
            List<CategoryTab> categoryTabs,
            List<CampaignDtos.Detail> campaigns
    ) {
        public static HomepageSectionPayload bare(String code, String title, String subtitle, Integer limit) {
            return new HomepageSectionPayload(code, title, subtitle, limit, null, null, null, null, null);
        }
    }

    public record HomepageLayout(List<HomepageSectionPayload> sections, Stats stats) {}
}
