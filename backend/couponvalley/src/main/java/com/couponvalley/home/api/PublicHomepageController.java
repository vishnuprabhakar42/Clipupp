package com.couponvalley.home.api;

import com.couponvalley.coupons.api.dto.CouponSummary;
import com.couponvalley.coupons.application.CouponService;
import com.couponvalley.coupons.application.CouponService.CouponWithStore;
import com.couponvalley.home.api.dto.PublicHomepageDtos;
import com.couponvalley.home.api.dto.PublicHomepageDtos.CategoryItem;
import com.couponvalley.home.api.dto.PublicHomepageDtos.HomepageLayout;
import com.couponvalley.home.api.dto.PublicHomepageDtos.HomepageSectionPayload;
import com.couponvalley.home.application.HomepageService;
import com.couponvalley.home.domain.HomepageSection;
import com.couponvalley.stores.api.dto.StoreSummary;
import com.couponvalley.stores.application.StoreService;
import com.couponvalley.stores.domain.Store;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.ArrayList;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Resolved homepage in a single round-trip. Heavy lifting is cached so warm
 * traffic hits the in-memory store and never touches Postgres.
 */
@RestController
@RequestMapping(path = "/api/v1/homepage", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "homepage", description = "Public homepage layout")
public class PublicHomepageController {

    private final HomepageService homepageService;
    private final StoreService storeService;
    private final CouponService couponService;

    public PublicHomepageController(HomepageService homepageService,
                                    StoreService storeService,
                                    CouponService couponService) {
        this.homepageService = homepageService;
        this.couponService = couponService;
        this.storeService = storeService;
    }

    @GetMapping
    @Cacheable(cacheNames = "homepage.layout", key = "'public.layout'", unless = "#result == null")
    public HomepageLayout layout() {
        List<HomepageSection> sections = homepageService.listEnabledOrdered();
        List<HomepageSectionPayload> resolved = new ArrayList<>(sections.size());
        for (HomepageSection s : sections) {
            resolved.add(resolveSection(s));
        }
        return new HomepageLayout(resolved);
    }

    private HomepageSectionPayload resolveSection(HomepageSection s) {
        Integer limit = s.getItemLimit();
        return switch (s.getCode()) {
            case "trending_stores" -> {
                int take = limit == null ? 12 : limit;
                List<StoreSummary> items = storeService.listActive(null, null, take)
                        .data().stream().map(StoreSummary::from).toList();
                yield new HomepageSectionPayload(s.getCode(), s.getTitle(), s.getSubtitle(),
                        limit, items, null, null);
            }
            case "featured_stores" -> {
                int take = limit == null ? 18 : limit;
                List<Store> featured = homepageService.featuredStores();
                List<StoreSummary> items;
                if (featured.isEmpty()) {
                    items = storeService.listActive(null, null, take)
                            .data().stream().map(StoreSummary::from).toList();
                } else {
                    items = featured.stream().limit(take).map(StoreSummary::from).toList();
                }
                yield new HomepageSectionPayload(s.getCode(), s.getTitle(), s.getSubtitle(),
                        limit, items, null, null);
            }
            case "top_deals" -> {
                int take = limit == null ? 10 : limit;
                // Prefer admin-pinned featured coupons; fall back to popularity-sorted top.
                List<CouponSummary> items;
                List<com.couponvalley.coupons.domain.Coupon> featured = homepageService.featuredCoupons();
                if (!featured.isEmpty()) {
                    var byStore = new java.util.HashMap<java.util.UUID, Store>();
                    for (var c : featured) {
                        couponService.findStore(c.getStoreId()).ifPresent(st -> byStore.put(st.getId(), st));
                    }
                    items = featured.stream().limit(take)
                            .map(c -> CouponSummary.from(c, byStore.get(c.getStoreId())))
                            .toList();
                } else {
                    List<CouponWithStore> withStores = couponService.homepageTopWithStores(take);
                    items = withStores.stream()
                            .map(p -> CouponSummary.from(p.coupon(), p.store()))
                            .toList();
                }
                yield new HomepageSectionPayload(s.getCode(), s.getTitle(), s.getSubtitle(),
                        limit, null, items, null);
            }
            case "trusted_brands" -> {
                // Logo-only carousel under a serif headline. Admin can pin
                // specific stores via featured-items; otherwise we use the
                // popularity-ordered list.
                int take = limit == null ? 12 : limit;
                List<Store> featured = homepageService.featuredStores();
                List<StoreSummary> items;
                if (!featured.isEmpty()) {
                    items = featured.stream().limit(take).map(StoreSummary::from).toList();
                } else {
                    items = storeService.listActive(null, null, take)
                            .data().stream().map(StoreSummary::from).toList();
                }
                yield new HomepageSectionPayload(s.getCode(), s.getTitle(), s.getSubtitle(),
                        limit, items, null, null);
            }
            case "popular_categories" -> {
                List<CategoryItem> items = homepageService.featuredCategories().stream()
                        .map(c -> new CategoryItem(c.getSlug(), c.getTitle(), c.getIcon()))
                        .toList();
                yield new HomepageSectionPayload(s.getCode(), s.getTitle(), s.getSubtitle(),
                        limit, null, null, items);
            }
            // The rest of the sections drive their own data clients-side
            // (banners come from /api/v1/banners, blog from /api/v1/blog,
            // newsletter is static). The frontend only needs title/subtitle.
            default -> new HomepageSectionPayload(s.getCode(), s.getTitle(), s.getSubtitle(),
                    limit, null, null, null);
        };
    }
}
