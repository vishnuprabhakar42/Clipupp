package com.couponvalley.home.application;

import com.couponvalley.categories.application.CategoryService;
import com.couponvalley.categories.domain.Category;
import com.couponvalley.common.audit.AuditLogService;
import com.couponvalley.common.error.ApiException;
import com.couponvalley.coupons.application.CouponService;
import com.couponvalley.coupons.domain.Coupon;
import com.couponvalley.home.api.dto.HomepageDtos;
import com.couponvalley.home.domain.HomepageSection;
import com.couponvalley.home.infra.HomepageSectionRepository;
import com.couponvalley.stores.application.StoreService;
import com.couponvalley.stores.domain.Store;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrates the homepage layout — sections + featured-item assignments
 * across stores, coupons, and categories. Domain services own their own
 * featured flags; this service is purely a coordinator + read aggregator.
 */
@Service
public class HomepageService {

    public enum FeaturedType { stores, coupons, categories }

    private final HomepageSectionRepository sectionRepo;
    private final StoreService storeService;
    private final CouponService couponService;
    private final CategoryService categoryService;
    private final AuditLogService audit;

    public HomepageService(HomepageSectionRepository sectionRepo,
                           StoreService storeService,
                           CouponService couponService,
                           CategoryService categoryService,
                           AuditLogService audit) {
        this.sectionRepo = sectionRepo;
        this.storeService = storeService;
        this.couponService = couponService;
        this.categoryService = categoryService;
        this.audit = audit;
    }

    // ---- Sections ----------------------------------------------------------

    @Cacheable(cacheNames = "homepage.layout", key = "'sections.enabled'", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<HomepageSection> listEnabledOrdered() {
        return sectionRepo.findEnabledOrdered();
    }

    @Transactional(readOnly = true)
    public List<HomepageSection> listAllOrdered() {
        return sectionRepo.findAllOrdered();
    }

    @CacheEvict(cacheNames = "homepage.layout", allEntries = true)
    @Transactional
    public HomepageSection updateSection(UUID id, HomepageDtos.SectionUpdate input) {
        HomepageSection s = sectionRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("Section not found"));
        if (input.title() != null) s.setTitle(input.title());
        if (input.subtitle() != null) s.setSubtitle(input.subtitle().isBlank() ? null : input.subtitle());
        if (input.enabled() != null) s.setEnabled(input.enabled());
        if (input.itemLimit() != null) s.setItemLimit(input.itemLimit());
        if (input.config() != null) s.setConfig(input.config());
        audit.record("HOMEPAGE_SECTION_UPDATE", "homepage_section", s.getId(),
                Map.of("code", s.getCode()));
        return s;
    }

    @CacheEvict(cacheNames = "homepage.layout", allEntries = true)
    @Transactional
    public void reorder(List<UUID> orderedIds) {
        // Two-pass: first move each row to a high temporary position to avoid
        // unique-position conflicts if you ever add a unique index, then
        // collapse to the final 0..N-1 ordering.
        List<HomepageSection> all = sectionRepo.findAllOrdered();
        Map<UUID, HomepageSection> byId = new java.util.HashMap<>();
        for (HomepageSection s : all) byId.put(s.getId(), s);
        int pos = 0;
        for (UUID id : orderedIds) {
            HomepageSection s = byId.get(id);
            if (s == null) continue;
            s.setPosition(pos++);
        }
        // Anything not in the list keeps its old relative order pushed to the end.
        int tail = pos;
        for (HomepageSection s : all) {
            if (!orderedIds.contains(s.getId())) s.setPosition(tail++);
        }
        audit.record("HOMEPAGE_REORDER", "homepage_section", null,
                Map.of("count", orderedIds.size()));
    }

    // ---- Featured items (delegated to domain services) ---------------------

    @Transactional(readOnly = true)
    public List<Store> featuredStores() {
        return storeService.findFeatured();
    }

    @Transactional(readOnly = true)
    public List<Coupon> featuredCoupons() {
        return couponService.findFeatured();
    }

    @Transactional(readOnly = true)
    public List<Category> featuredCategories() {
        return categoryService.findFeatured();
    }

    @CacheEvict(cacheNames = "homepage.layout", allEntries = true)
    @Transactional
    public void setFeatured(FeaturedType type, List<HomepageDtos.FeaturedAssignment> items) {
        List<HomepageDtos.FeaturedAssignment> safe = items == null ? List.of() : items;
        switch (type) {
            case stores -> storeService.setFeatured(
                    safe.stream().map(a -> new StoreService.SlugPosition(a.slug(), a.position())).toList());
            case coupons -> couponService.setFeatured(
                    safe.stream().map(a -> new CouponService.SlugPosition(a.slug(), a.position())).toList());
            case categories -> categoryService.setFeatured(
                    safe.stream().map(a -> new CategoryService.SlugPosition(a.slug(), a.position())).toList());
        }
    }
}
