package com.couponvalley.stores.application;

import com.couponvalley.common.audit.AuditLogService;
import com.couponvalley.common.error.ApiException;
import com.couponvalley.common.pagination.CursorEncoder;
import com.couponvalley.common.pagination.CursorPage;
import com.couponvalley.common.text.Slugifier;
import com.couponvalley.coupons.domain.Coupon;
import com.couponvalley.coupons.domain.CouponStatus;
import com.couponvalley.coupons.infra.CouponRepository;
import com.couponvalley.stores.domain.ContentWriter;
import com.couponvalley.stores.domain.Faq;
import com.couponvalley.stores.domain.FeaturedArticle;
import com.couponvalley.stores.domain.Stats;
import com.couponvalley.stores.domain.Store;
import com.couponvalley.stores.domain.StoreStatus;
import com.couponvalley.stores.domain.StoreTopOffer;
import com.couponvalley.stores.infra.ContentWriterRepository;
import com.couponvalley.stores.infra.FaqRepository;
import com.couponvalley.stores.infra.FeaturedArticleRepository;
import com.couponvalley.stores.infra.StatsRepository;
import com.couponvalley.stores.infra.StoreRepository;
import com.couponvalley.stores.infra.StoreTopOfferRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StoreService {

    public static final int LIST_DEFAULT_LIMIT = 24;

    private final StoreRepository storeRepo;
    private final StatsRepository statsRepo;
    private final ContentWriterRepository contentWriterRepo;
    private final FaqRepository faqRepo;
    private final FeaturedArticleRepository featuredArticleRepo;
    private final StoreTopOfferRepository topOfferRepo;
    private final CouponRepository couponRepo;
    private final AuditLogService audit;

    public StoreService(StoreRepository storeRepo,
                        StatsRepository statsRepo,
                        ContentWriterRepository contentWriterRepo,
                        FaqRepository faqRepo,
                        FeaturedArticleRepository featuredArticleRepo,
                        StoreTopOfferRepository topOfferRepo,
                        CouponRepository couponRepo,
                        AuditLogService audit) {
        this.storeRepo = storeRepo;
        this.statsRepo = statsRepo;
        this.contentWriterRepo = contentWriterRepo;
        this.faqRepo = faqRepo;
        this.featuredArticleRepo = featuredArticleRepo;
        this.topOfferRepo = topOfferRepo;
        this.couponRepo = couponRepo;
        this.audit = audit;
    }

    // ---- Public read paths -------------------------------------------------

    @Cacheable(cacheNames = "store.detail", key = "#slug", unless = "#result == null")
    @Transactional(readOnly = true)
    public StoreDetail findActiveBySlug(String slug) {
        Store store = storeRepo.findBySlugAndDeletedAtIsNull(slug)
                .filter(s -> s.getStatus() == StoreStatus.ACTIVE)
                .orElse(null);
        if (store == null) return null;

        Stats stats = statsRepo.findById(store.getId()).orElse(null);
        ContentWriter writer = contentWriterRepo.findById(store.getId()).orElse(null);
        List<Faq> faqs = faqRepo.findByStoreIdOrderByPositionAsc(store.getId());
        List<FeaturedArticle> articles = featuredArticleRepo.findByStoreIdOrderByPositionAsc(store.getId());
        List<StoreTopOffer> topOffers = topOfferRepo.findByStoreId(store.getId());

        return new StoreDetail(store, stats, writer, faqs, articles, topOffers);
    }

    @Transactional(readOnly = true)
    public CursorPage<Store> listActive(String countryCode, String cursor, Integer limit) {
        int size = limit == null ? LIST_DEFAULT_LIMIT : Math.max(1, Math.min(limit, 100));
        int page = CursorEncoder.decodePageOr(cursor, 0);
        Page<Store> result = storeRepo.listActive(StoreStatus.ACTIVE, countryCode, PageRequest.of(page, size));
        return CursorPage.from(result, s -> s);
    }

    @Transactional(readOnly = true)
    public CursorPage<Store> listByCategory(String categorySlug, String countryCode, String cursor, Integer limit) {
        int size = limit == null ? LIST_DEFAULT_LIMIT : Math.max(1, Math.min(limit, 100));
        int page = CursorEncoder.decodePageOr(cursor, 0);
        Page<Store> result = storeRepo.listByCategorySlug(categorySlug, countryCode, PageRequest.of(page, size));
        return CursorPage.from(result, s -> s);
    }

    @Transactional(readOnly = true)
    public List<Store> findSimilar(UUID excludeId, int limit) {
        return storeRepo.findSimilarTo(excludeId, StoreStatus.ACTIVE, PageRequest.of(0, limit)).getContent();
    }

    // ---- Stats helper consumed by store-detail builder + admin ------------

    @Transactional(readOnly = true)
    public Stats refreshStats(UUID storeId) {
        OffsetDateTime now = OffsetDateTime.now();
        long total = couponRepo.countActiveForStore(storeId, CouponStatus.ACTIVE, now);
        Stats stats = statsRepo.findById(storeId).orElseGet(() -> new Stats(storeId));
        stats.setTotalOffers((int) total);
        int code = 0, freeShip = 0, inStore = 0;
        for (Object[] r : couponRepo.countByTypeForStore(storeId, CouponStatus.ACTIVE, now)) {
            Object typeRaw = r[0];
            long n = ((Number) r[1]).longValue();
            String t = typeRaw == null ? "" : typeRaw.toString();
            switch (t) {
                case "CODE" -> code = (int) n;
                case "FREE_SHIPPING" -> freeShip = (int) n;
                case "IN_STORE" -> inStore = (int) n;
                default -> { /* DEAL */ }
            }
        }
        stats.setCouponCodes(code);
        stats.setFreeShippingDeals(freeShip);
        stats.setInStoreCoupons(inStore);
        stats.touch();
        return statsRepo.save(stats);
    }

    // ---- Admin write paths -------------------------------------------------

    @CacheEvict(cacheNames = {"store.detail", "homepage.top", "homepage.layout"}, allEntries = true)
    @Transactional
    public Store createStore(CreateStoreCommand cmd) {
        String slug = (cmd.slug() == null || cmd.slug().isBlank())
                ? Slugifier.slugify(cmd.name())
                : Slugifier.slugify(cmd.slug());
        if (slug.isBlank()) {
            throw new ApiException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_SLUG", "Cannot derive a slug from the name");
        }
        if (storeRepo.existsBySlug(slug)) {
            throw ApiException.conflict("A store with this slug already exists");
        }
        Store store = Store.create(slug, cmd.name(), cmd.logoUrl(), cmd.description(), cmd.primaryUrl(), cmd.countryCode());
        store.setShortDescription(cmd.shortDescription());
        store.setRating(cmd.rating());
        store.setReviewCount(cmd.reviewCount() == null ? 0 : cmd.reviewCount());
        store.setPhone(cmd.phone());
        store.setAddress(cmd.address());
        store.setMetaTitle(cmd.metaTitle());
        store.setMetaDescription(cmd.metaDescription());
        store.setPopularityScore(cmd.popularityScore() == null ? 0 : cmd.popularityScore());
        store.setBrandColor(cmd.brandColor());
        store.setCashbackRate(cmd.cashbackRate());
        store.setPreviousCashbackRate(cmd.previousCashbackRate());
        store.setTagline(cmd.tagline());
        if (cmd.featured() != null) store.setFeatured(cmd.featured());
        Store saved = storeRepo.save(store);

        statsRepo.save(new Stats(saved.getId()));
        applyTopOffers(saved.getId(), cmd.topOffers());
        audit.record("STORE_CREATE", "store", saved.getId(), Map.of("slug", slug));
        return saved;
    }

    @CacheEvict(cacheNames = {"store.detail", "homepage.top", "homepage.layout"}, allEntries = true)
    @Transactional
    public Store updateStore(UUID id, UpdateStoreCommand cmd) {
        Store store = storeRepo.findById(id).orElseThrow(() -> ApiException.notFound("Store not found"));
        if (cmd.slug() != null) {
            String newSlug = Slugifier.slugify(cmd.slug());
            if (!newSlug.equals(store.getSlug())) {
                if (storeRepo.existsBySlug(newSlug)) throw ApiException.conflict("Slug already in use");
                store.setSlug(newSlug);
            }
        }
        if (cmd.name() != null) store.setName(cmd.name());
        if (cmd.logoUrl() != null) store.setLogoUrl(cmd.logoUrl());
        if (cmd.description() != null) store.setDescription(cmd.description());
        if (cmd.shortDescription() != null) store.setShortDescription(cmd.shortDescription());
        if (cmd.rating() != null) store.setRating(cmd.rating());
        if (cmd.reviewCount() != null) store.setReviewCount(cmd.reviewCount());
        if (cmd.phone() != null) store.setPhone(cmd.phone());
        if (cmd.address() != null) store.setAddress(cmd.address());
        if (cmd.primaryUrl() != null) store.setPrimaryUrl(cmd.primaryUrl());
        if (cmd.countryCode() != null) store.setCountryCode(cmd.countryCode());
        if (cmd.status() != null) store.setStatus(cmd.status());
        if (cmd.popularityScore() != null) store.setPopularityScore(cmd.popularityScore());
        if (cmd.brandColor() != null) store.setBrandColor(cmd.brandColor().isBlank() ? null : cmd.brandColor());
        if (cmd.cashbackRate() != null) store.setCashbackRate(cmd.cashbackRate().isBlank() ? null : cmd.cashbackRate());
        if (cmd.previousCashbackRate() != null) store.setPreviousCashbackRate(cmd.previousCashbackRate().isBlank() ? null : cmd.previousCashbackRate());
        if (cmd.tagline() != null) store.setTagline(cmd.tagline().isBlank() ? null : cmd.tagline());
        if (cmd.featured() != null) store.setFeatured(cmd.featured());
        if (cmd.metaTitle() != null) store.setMetaTitle(cmd.metaTitle());
        if (cmd.metaDescription() != null) store.setMetaDescription(cmd.metaDescription());
        if (cmd.topOffers() != null) applyTopOffers(store.getId(), cmd.topOffers());
        audit.record("STORE_UPDATE", "store", store.getId(), Map.of("slug", store.getSlug()));
        return store;
    }

    // ---- Admin read paths --------------------------------------------------

    @Transactional(readOnly = true)
    public Page<Store> listForAdmin(String q, String countryCode, StoreStatus status,
                                    Boolean featured, Pageable pageable) {
        return storeRepo.adminSearch(
                q == null || q.isBlank() ? null : q.trim().toLowerCase(),
                countryCode == null || countryCode.isBlank() ? null : countryCode,
                status,
                featured,
                pageable);
    }

    @Transactional(readOnly = true)
    public Store findForAdmin(UUID id) {
        return storeRepo.findById(id).orElseThrow(() -> ApiException.notFound("Store not found"));
    }

    @Transactional(readOnly = true)
    public List<StoreTopOffer> topOffers(UUID storeId) {
        return topOfferRepo.findByStoreId(storeId);
    }

    @Transactional(readOnly = true)
    public List<Store> findFeatured() {
        return storeRepo.findFeatured();
    }

    /**
     * Replace the entire featured set with `assignments`. Each entry is a slug
     * + a 0-based position. Stores not in the assignments are unfeatured.
     */
    @CacheEvict(cacheNames = {"store.detail", "homepage.top", "homepage.layout"}, allEntries = true)
    @Transactional
    public void setFeatured(List<SlugPosition> assignments) {
        // Clear existing flags so removed items are unfeatured.
        for (Store s : storeRepo.findFeatured()) {
            s.setFeatured(false);
            s.setFeaturedPosition(null);
        }
        if (assignments == null || assignments.isEmpty()) return;
        for (SlugPosition a : assignments) {
            storeRepo.findBySlugAndDeletedAtIsNull(a.slug()).ifPresent(s -> {
                s.setFeatured(true);
                s.setFeaturedPosition(a.position());
            });
        }
        audit.record("STORES_FEATURED_SET", "store", null,
                Map.of("count", assignments.size()));
    }

    public record SlugPosition(String slug, int position) {}

    // ---- Bulk admin actions ------------------------------------------------

    public enum BulkAction { DEACTIVATE, RESTORE, FEATURE, UNFEATURE }

    public record BulkResult(int matched, int updated) {}

    @CacheEvict(cacheNames = {"store.detail", "homepage.top", "homepage.layout"}, allEntries = true)
    @Transactional
    public BulkResult bulk(BulkAction action, List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return new BulkResult(0, 0);
        List<Store> rows = storeRepo.findAllById(ids);
        int matched = rows.size();
        int updated = 0;
        for (Store s : rows) {
            switch (action) {
                case DEACTIVATE -> {
                    if (s.getStatus() != StoreStatus.DELETED) {
                        s.softDelete();
                        updated++;
                    }
                }
                case RESTORE -> {
                    if (s.getStatus() == StoreStatus.DELETED) {
                        s.restore();
                        updated++;
                    }
                }
                case FEATURE -> {
                    if (!s.isFeatured()) { s.setFeatured(true); updated++; }
                }
                case UNFEATURE -> {
                    if (s.isFeatured()) {
                        s.setFeatured(false);
                        s.setFeaturedPosition(null);
                        updated++;
                    }
                }
            }
        }
        audit.record("STORES_BULK", "store", null,
                Map.of("action", action.name(), "matched", matched, "updated", updated));
        return new BulkResult(matched, updated);
    }

    @CacheEvict(cacheNames = "store.detail", allEntries = true)
    @Transactional
    public void softDelete(UUID id) {
        Store store = storeRepo.findById(id).orElseThrow(() -> ApiException.notFound("Store not found"));
        store.softDelete();
        audit.record("STORE_DELETE", "store", store.getId(), Map.of("slug", store.getSlug()));
    }

    @CacheEvict(cacheNames = "store.detail", allEntries = true)
    @Transactional
    public void restore(UUID id) {
        Store store = storeRepo.findById(id).orElseThrow(() -> ApiException.notFound("Store not found"));
        store.restore();
        audit.record("STORE_RESTORE", "store", store.getId(), Map.of("slug", store.getSlug()));
    }

    @Transactional
    public Page<Coupon> listCouponsForStore(UUID storeId, int page, int size) {
        return couponRepo.listForStore(storeId, CouponStatus.ACTIVE, OffsetDateTime.now(), PageRequest.of(page, size));
    }

    private void applyTopOffers(UUID storeId, List<String> texts) {
        topOfferRepo.deleteByStoreId(storeId);
        if (texts == null) return;
        short pos = 0;
        List<StoreTopOffer> rows = new ArrayList<>(texts.size());
        for (String t : texts) {
            if (t == null || t.isBlank()) continue;
            rows.add(new StoreTopOffer(storeId, pos++, t.trim()));
        }
        topOfferRepo.saveAll(rows);
    }

    // ---- DTO records used as command input ---------------------------------

    public record CreateStoreCommand(
            String name, String slug, String logoUrl, String description, String shortDescription,
            BigDecimal rating, Integer reviewCount, String phone, String address,
            String primaryUrl, String countryCode, Integer popularityScore,
            String brandColor, String cashbackRate, String previousCashbackRate,
            String tagline, Boolean featured,
            String metaTitle, String metaDescription, List<String> topOffers) {}

    public record UpdateStoreCommand(
            String name, String slug, String logoUrl, String description, String shortDescription,
            BigDecimal rating, Integer reviewCount, String phone, String address,
            String primaryUrl, String countryCode, StoreStatus status, Integer popularityScore,
            String brandColor, String cashbackRate, String previousCashbackRate,
            String tagline, Boolean featured,
            String metaTitle, String metaDescription, List<String> topOffers) {}

    public record StoreDetail(
            Store store,
            Stats stats,
            ContentWriter writer,
            List<Faq> faqs,
            List<FeaturedArticle> articles,
            List<StoreTopOffer> topOffers) {

        public Optional<Stats> statsOpt() { return Optional.ofNullable(stats); }
        public Optional<ContentWriter> writerOpt() { return Optional.ofNullable(writer); }
    }
}
