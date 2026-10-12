package com.clipupp.home.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.clipupp.campaigns.application.CampaignService;
import com.clipupp.categories.application.CategoryService;
import com.clipupp.categories.domain.Category;
import com.clipupp.coupons.application.CouponService;
import com.clipupp.coupons.application.CouponService.CouponWithStore;
import com.clipupp.coupons.domain.Coupon;
import com.clipupp.home.api.dto.PublicHomepageDtos.HomepageLayout;
import com.clipupp.home.api.dto.PublicHomepageDtos.HomepageSectionPayload;
import com.clipupp.home.domain.HomepageSection;
import com.clipupp.stores.application.StoreService;
import com.clipupp.stores.domain.Store;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class HomepageResolverTest {

    private final HomepageService homepageService = mock(HomepageService.class);
    private final StoreService storeService = mock(StoreService.class);
    private final CouponService couponService = mock(CouponService.class);
    private final CategoryService categoryService = mock(CategoryService.class);
    private final CampaignService campaignService = mock(CampaignService.class);
    private HomepageResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new HomepageResolver(homepageService, storeService, couponService, categoryService, campaignService);
        when(couponService.countVerifiedSince(any())).thenReturn(12L);
        when(couponService.countActive()).thenReturn(300L);
        when(storeService.countActive()).thenReturn(40L);
    }

    private static HomepageSection section(String code, Integer limit) {
        HomepageSection s = mock(HomepageSection.class);
        when(s.getCode()).thenReturn(code);
        when(s.getTitle()).thenReturn(code + " title");
        when(s.getSubtitle()).thenReturn(null);
        when(s.getItemLimit()).thenReturn(limit);
        return s;
    }

    private static Category category(String slug, String title) {
        Category c = mock(Category.class);
        when(c.getSlug()).thenReturn(slug);
        when(c.getTitle()).thenReturn(title);
        when(c.getIcon()).thenReturn(null);
        return c;
    }

    private static Store store(String slug) {
        Store s = mock(Store.class);
        when(s.getId()).thenReturn(UUID.randomUUID());
        when(s.getSlug()).thenReturn(slug);
        when(s.getName()).thenReturn(slug);
        when(s.getLogoUrl()).thenReturn("https://x/" + slug + ".png");
        when(s.getCountryCode()).thenReturn("IN");
        return s;
    }

    private static Coupon coupon(Store s) {
        Coupon c = mock(Coupon.class);
        when(c.getId()).thenReturn(UUID.randomUUID());
        when(c.getSlug()).thenReturn("c-" + UUID.randomUUID());
        UUID storeId = s.getId();
        when(c.getStoreId()).thenReturn(storeId);
        when(c.getTitle()).thenReturn("Save");
        when(c.getDescription()).thenReturn("d");
        when(c.getCategories()).thenReturn(java.util.Set.of());
        return c;
    }

    @Test
    void statsComeFromServices() {
        HomepageLayout out = resolver.resolve(List.of());
        assertThat(out.stats().verifiedLast7d()).isEqualTo(12L);
        assertThat(out.stats().activeCoupons()).isEqualTo(300L);
        assertThat(out.stats().activeStores()).isEqualTo(40L);
    }

    @Test
    void topDealsFallsBackToFirstSevenRootsAndKeepsEmptyTabs() {
        when(categoryService.findFeatured()).thenReturn(List.of());
        List<Category> roots = new java.util.ArrayList<>();
        for (int i = 0; i < 9; i++) roots.add(category("cat" + i, "Cat " + i));
        when(categoryService.activeRoots()).thenReturn(roots);
        when(couponService.topInCategoryWithStores(any(), anyInt())).thenReturn(List.of());

        HomepageLayout out = resolver.resolve(List.of(section("top_deals", 4)));

        HomepageSectionPayload p = out.sections().get(0);
        assertThat(p.categoryTabs()).hasSize(7);
        assertThat(p.categoryTabs().get(0).slug()).isEqualTo("cat0");
        assertThat(p.categoryTabs().get(0).coupons()).isEmpty();
    }

    @Test
    void featuredStoresCarryZeroCountWhenNoCoupons() {
        Store s = store("ola");
        when(homepageService.featuredStores()).thenReturn(List.of(s));
        when(couponService.activeCountsByStore(any())).thenReturn(Map.of());

        HomepageLayout out = resolver.resolve(List.of(section("featured_stores", 12)));

        assertThat(out.sections().get(0).stores().get(0).activeCouponCount()).isEqualTo(0);
    }

    @Test
    void bankOffersReturnsEmptyListWhenNoCampaigns() {
        when(campaignService.findActive(2)).thenReturn(List.of());
        HomepageLayout out = resolver.resolve(List.of(section("bank_offers", 2)));
        assertThat(out.sections().get(0).campaigns()).isEmpty();
    }

    @Test
    void trendingUsesVerifiedQuery() {
        Store s = store("myntra");
        Coupon c = coupon(s);
        when(couponService.trendingVerifiedWithStores(7)).thenReturn(List.of(new CouponWithStore(c, s)));
        HomepageLayout out = resolver.resolve(List.of(section("trending_coupons", 7)));
        assertThat(out.sections().get(0).coupons()).hasSize(1);
        assertThat(out.sections().get(0).coupons().get(0).storeSlug()).isEqualTo("myntra");
    }

    @Test
    void heroChipsFallBackToFirstEightRoots() {
        when(categoryService.findFeatured()).thenReturn(List.of());
        List<Category> roots = new java.util.ArrayList<>();
        for (int i = 0; i < 10; i++) roots.add(category("cat" + i, "Cat " + i));
        when(categoryService.activeRoots()).thenReturn(roots);
        when(couponService.trendingVerifiedWithStores(3)).thenReturn(List.of());

        HomepageLayout out = resolver.resolve(List.of(section("hero_search", null)));

        assertThat(out.sections().get(0).categories()).hasSize(8);
        assertThat(out.sections().get(0).coupons()).isEmpty();
    }

    @Test
    void zeroItemLimitOnTopDealsIsClampedAndStillReturnsPayload() {
        List<Category> pinned = List.of(category("fashion", "Fashion"));
        when(categoryService.findFeatured()).thenReturn(pinned);
        when(couponService.topInCategoryWithStores(any(), anyInt())).thenReturn(List.of());

        HomepageLayout out = resolver.resolve(List.of(section("top_deals", 0)));

        HomepageSectionPayload p = out.sections().get(0);
        assertThat(p.code()).isEqualTo("top_deals");
        assertThat(p.categoryTabs()).hasSize(1);
        verify(couponService).topInCategoryWithStores("fashion", 1);
    }

    @Test
    void hugeItemLimitIsClampedToMax() {
        when(couponService.trendingVerifiedWithStores(anyInt())).thenReturn(List.of());

        resolver.resolve(List.of(section("trending_coupons", 100_000)));

        verify(couponService).trendingVerifiedWithStores(HomepageResolver.MAX_LIMIT);
    }

    @Test
    void failingSectionYieldsBarePayloadAndOthersStillResolve() {
        when(couponService.trendingVerifiedWithStores(anyInt())).thenThrow(new IllegalStateException("db down"));
        when(campaignService.findActive(2)).thenReturn(List.of());

        HomepageLayout out = resolver.resolve(List.of(
                section("trending_coupons", 7),
                section("bank_offers", 2),
                section("verify_band", null)));

        assertThat(out.sections()).hasSize(3);
        HomepageSectionPayload trending = out.sections().get(0);
        assertThat(trending.code()).isEqualTo("trending_coupons");
        assertThat(trending.title()).isEqualTo("trending_coupons title");
        assertThat(trending.coupons()).isNull();
        assertThat(out.sections().get(1).campaigns()).isEmpty();
        assertThat(out.sections().get(2).code()).isEqualTo("verify_band");
        assertThat(out.stats().activeStores()).isEqualTo(40L);
    }

    @Test
    void failingStatsFallBackToZeros() {
        when(couponService.countActive()).thenThrow(new IllegalStateException("db down"));

        HomepageLayout out = resolver.resolve(List.of());

        assertThat(out.stats().activeCoupons()).isZero();
        assertThat(out.stats().verifiedLast7d()).isZero();
    }
}
