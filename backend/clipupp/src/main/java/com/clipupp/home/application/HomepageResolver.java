package com.clipupp.home.application;

import com.clipupp.campaigns.api.dto.CampaignDtos;
import com.clipupp.campaigns.application.CampaignService;
import com.clipupp.categories.application.CategoryService;
import com.clipupp.categories.domain.Category;
import com.clipupp.coupons.api.dto.CouponSummary;
import com.clipupp.coupons.application.CouponService;
import com.clipupp.coupons.application.CouponService.CouponWithStore;
import com.clipupp.home.api.dto.PublicHomepageDtos.CategoryItem;
import com.clipupp.home.api.dto.PublicHomepageDtos.CategoryTab;
import com.clipupp.home.api.dto.PublicHomepageDtos.HomepageLayout;
import com.clipupp.home.api.dto.PublicHomepageDtos.HomepageSectionPayload;
import com.clipupp.home.api.dto.PublicHomepageDtos.Stats;
import com.clipupp.home.domain.HomepageSection;
import com.clipupp.stores.api.dto.StoreSummary;
import com.clipupp.stores.application.StoreService;
import com.clipupp.stores.domain.Store;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Turns enabled homepage_section rows into the public payload. One place
 * knows which section code needs which data, so adding a section is one
 * case here plus one renderer in the frontend SECTION_RENDERERS map.
 *
 * Section codes (spec: 2026-10-12-homepage-v2-design.md):
 *   hero_search       categories (chips) + coupons (3 fanned cards)
 *   trending_coupons  coupons (verified, by popularity)
 *   featured_stores   stores with activeCouponCount
 *   top_deals         categoryTabs (pinned categories or first 7 roots, N coupons each)
 *   bank_offers       campaigns (active, newest first)
 *   verify_band       copy only
 *   newsletter        copy only
 */
@Component
public class HomepageResolver {

    private static final Logger log = LoggerFactory.getLogger(HomepageResolver.class);

    static final int HERO_CHIPS = 8;
    static final int HERO_FAN = 3;
    static final int DEFAULT_TRENDING = 7;
    static final int DEFAULT_STORES = 12;
    static final int DEFAULT_TABS = 7;
    static final int DEFAULT_PER_TAB = 4;
    static final int DEFAULT_CAMPAIGNS = 2;
    /** Upper bound for any admin-set item_limit so one keystroke cannot load a whole table. */
    static final int MAX_LIMIT = 50;

    private final HomepageService homepageService;
    private final StoreService storeService;
    private final CouponService couponService;
    private final CategoryService categoryService;
    private final CampaignService campaignService;

    public HomepageResolver(HomepageService homepageService,
                            StoreService storeService,
                            CouponService couponService,
                            CategoryService categoryService,
                            CampaignService campaignService) {
        this.homepageService = homepageService;
        this.storeService = storeService;
        this.couponService = couponService;
        this.categoryService = categoryService;
        this.campaignService = campaignService;
    }

    public HomepageLayout resolve(List<HomepageSection> sections) {
        List<HomepageSectionPayload> resolved = new ArrayList<>(sections.size());
        for (HomepageSection s : sections) resolved.add(resolveSafely(s));
        return new HomepageLayout(resolved, stats());
    }

    /**
     * One failing section must not take the whole homepage down: log it and
     * hand the frontend the bare copy so the renderer can still decide what to show.
     */
    private HomepageSectionPayload resolveSafely(HomepageSection s) {
        try {
            return resolveSection(s);
        } catch (RuntimeException e) {
            log.warn("Homepage section '{}' failed to resolve, serving bare payload", s.getCode(), e);
            return HomepageSectionPayload.bare(s.getCode(), s.getTitle(), s.getSubtitle(), s.getItemLimit());
        }
    }

    private Stats stats() {
        try {
            OffsetDateTime weekAgo = OffsetDateTime.now().minusDays(7);
            return new Stats(
                    couponService.countVerifiedSince(weekAgo),
                    couponService.countActive(),
                    storeService.countActive());
        } catch (RuntimeException e) {
            log.warn("Homepage stats failed to resolve, serving zeros", e);
            return new Stats(0, 0, 0);
        }
    }

    private HomepageSectionPayload resolveSection(HomepageSection s) {
        Integer limit = s.getItemLimit();
        String code = s.getCode();
        String title = s.getTitle();
        String subtitle = s.getSubtitle();
        return switch (code) {
            case "hero_search" -> new HomepageSectionPayload(code, title, subtitle, limit,
                    null, toSummaries(couponService.trendingVerifiedWithStores(HERO_FAN)),
                    categoryItems(HERO_CHIPS), null, null);
            case "trending_coupons" -> new HomepageSectionPayload(code, title, subtitle, limit,
                    null, toSummaries(couponService.trendingVerifiedWithStores(limitOr(limit, DEFAULT_TRENDING))),
                    null, null, null);
            case "featured_stores" -> new HomepageSectionPayload(code, title, subtitle, limit,
                    storesWithCounts(limitOr(limit, DEFAULT_STORES)), null, null, null, null);
            case "top_deals" -> new HomepageSectionPayload(code, title, subtitle, limit,
                    null, null, null, categoryTabs(limitOr(limit, DEFAULT_PER_TAB)), null);
            case "bank_offers" -> new HomepageSectionPayload(code, title, subtitle, limit,
                    null, null, null, null,
                    campaignService.findActive(limitOr(limit, DEFAULT_CAMPAIGNS)).stream()
                            .map(CampaignDtos.Detail::from).toList());
            default -> HomepageSectionPayload.bare(code, title, subtitle, limit);
        };
    }

    private List<StoreSummary> storesWithCounts(int take) {
        List<Store> stores = homepageService.featuredStores();
        if (stores.isEmpty()) stores = storeService.listActive(null, null, take).data();
        List<Store> picked = stores.stream().limit(take).toList();
        Map<UUID, Integer> counts = couponService.activeCountsByStore(picked.stream().map(Store::getId).toList());
        return picked.stream()
                .map(st -> StoreSummary.from(st).withActiveCouponCount(counts.getOrDefault(st.getId(), 0)))
                .toList();
    }

    private List<CategoryTab> categoryTabs(int perTab) {
        List<CategoryTab> tabs = new ArrayList<>();
        for (Category c : pickCategories(DEFAULT_TABS)) {
            tabs.add(new CategoryTab(c.getSlug(), c.getTitle(),
                    toSummaries(couponService.topInCategoryWithStores(c.getSlug(), perTab))));
        }
        return tabs;
    }

    private List<CategoryItem> categoryItems(int take) {
        return pickCategories(take).stream()
                .map(c -> new CategoryItem(c.getSlug(), c.getTitle(), c.getIcon()))
                .toList();
    }

    /** Admin-pinned categories win; otherwise the first N active roots by position. */
    private List<Category> pickCategories(int take) {
        List<Category> pinned = categoryService.findFeatured();
        List<Category> source = pinned.isEmpty() ? categoryService.activeRoots() : pinned;
        return source.stream().limit(take).toList();
    }

    private static List<CouponSummary> toSummaries(List<CouponWithStore> pairs) {
        return pairs.stream().map(p -> CouponSummary.from(p.coupon(), p.store())).toList();
    }

    /** Admin limit or the default, clamped to [1, MAX_LIMIT]. */
    static int limitOr(Integer limit, int fallback) {
        int value = limit == null ? fallback : limit;
        return Math.max(1, Math.min(value, MAX_LIMIT));
    }
}
