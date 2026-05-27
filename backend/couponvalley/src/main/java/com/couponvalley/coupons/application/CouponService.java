package com.couponvalley.coupons.application;

import com.couponvalley.categories.domain.Category;
import com.couponvalley.categories.infra.CategoryRepository;
import com.couponvalley.common.audit.AuditLogService;
import com.couponvalley.common.error.ApiException;
import com.couponvalley.common.pagination.CursorEncoder;
import com.couponvalley.common.pagination.CursorPage;
import com.couponvalley.common.text.Slugifier;
import com.couponvalley.coupons.domain.Coupon;
import com.couponvalley.coupons.domain.CouponStatus;
import com.couponvalley.coupons.domain.CouponType;
import com.couponvalley.coupons.infra.CouponRepository;
import com.couponvalley.stores.domain.Store;
import com.couponvalley.stores.infra.StoreRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CouponService {

    public static final int LIST_DEFAULT_LIMIT = 24;

    private final CouponRepository couponRepo;
    private final StoreRepository storeRepo;
    private final CategoryRepository categoryRepo;
    private final AuditLogService audit;

    public CouponService(CouponRepository couponRepo,
                         StoreRepository storeRepo,
                         CategoryRepository categoryRepo,
                         AuditLogService audit) {
        this.couponRepo = couponRepo;
        this.storeRepo = storeRepo;
        this.categoryRepo = categoryRepo;
        this.audit = audit;
    }

    // ---- Public read paths -------------------------------------------------

    @Cacheable(cacheNames = "coupon.detail", key = "#slug", unless = "#result == null")
    @Transactional(readOnly = true)
    public CouponDetail findActiveBySlug(String slug) {
        Coupon coupon = couponRepo.findBySlugAndDeletedAtIsNull(slug)
                .filter(c -> c.getStatus() == CouponStatus.ACTIVE)
                .orElse(null);
        if (coupon == null) return null;
        Store store = storeRepo.findById(coupon.getStoreId()).orElse(null);
        return new CouponDetail(coupon, store);
    }

    @Transactional(readOnly = true)
    public CursorPage<Coupon> list(UUID storeId, Set<CouponType> types, boolean activeOnly,
                                   String cursor, Integer limit) {
        int size = limit == null ? LIST_DEFAULT_LIMIT : Math.max(1, Math.min(limit, 100));
        int page = CursorEncoder.decodePageOr(cursor, 0);
        OffsetDateTime now = activeOnly ? OffsetDateTime.now() : null;
        Set<CouponType> typeFilter = (types == null || types.isEmpty()) ? null : types;
        Page<Coupon> result = couponRepo.listActive(CouponStatus.ACTIVE, storeId, typeFilter, now,
                PageRequest.of(page, size));
        result.getContent().forEach(c -> c.getCategories().size());
        return CursorPage.from(result, c -> c);
    }

    @Transactional(readOnly = true)
    public CursorPage<Coupon> listByCategory(String categorySlug, String cursor, Integer limit) {
        int size = limit == null ? LIST_DEFAULT_LIMIT : Math.max(1, Math.min(limit, 100));
        int page = CursorEncoder.decodePageOr(cursor, 0);
        Page<Coupon> result = couponRepo.listByCategorySlug(categorySlug, PageRequest.of(page, size));
        result.getContent().forEach(c -> c.getCategories().size());
        return CursorPage.from(result, c -> c);
    }

    @Transactional(readOnly = true)
    public List<Coupon> homepageTop(int limit) {
        return couponRepo.findHomepageTop(OffsetDateTime.now(), PageRequest.of(0, limit));
    }

    /**
     * Top-N active coupon slugs by popularity. Slug-only projection —
     * consumed by the frontend's generateStaticParams at build time to
     * pre-render the highest-traffic coupon-detail pages.
     */
    @Transactional(readOnly = true)
    public List<String> topSlugs(int limit) {
        int capped = Math.max(1, Math.min(limit, 1000));
        return couponRepo.findTopSlugs(OffsetDateTime.now(), PageRequest.of(0, capped));
    }

    /** Same as {@link #homepageTop(int)} but with stores eagerly batched in for card rendering. */
    @Transactional(readOnly = true)
    public List<CouponWithStore> homepageTopWithStores(int limit) {
        List<Coupon> coupons = couponRepo.findHomepageTop(OffsetDateTime.now(), PageRequest.of(0, limit));
        if (coupons.isEmpty()) return List.of();
        coupons.forEach(c -> c.getCategories().size()); // materialize lazy categories
        Set<UUID> storeIds = new HashSet<>();
        for (Coupon c : coupons) storeIds.add(c.getStoreId());
        Map<UUID, Store> storeMap = new java.util.HashMap<>();
        for (Store s : storeRepo.findAllById(storeIds)) storeMap.put(s.getId(), s);
        return coupons.stream()
                .map(c -> new CouponWithStore(c, storeMap.get(c.getStoreId())))
                .toList();
    }

    public record CouponWithStore(Coupon coupon, Store store) {}

    // ---- Admin write paths -------------------------------------------------

    // ---- Admin read paths --------------------------------------------------

    @Transactional(readOnly = true)
    public Page<Coupon> listForAdmin(String q, UUID storeId, CouponStatus status, CouponType type,
                                     Pageable pageable) {
        Page<Coupon> res = couponRepo.adminSearch(
                q == null || q.isBlank() ? null : q.trim().toLowerCase(),
                storeId, status, type, pageable);
        res.getContent().forEach(c -> c.getCategories().size());
        return res;
    }

    @Transactional(readOnly = true)
    public Coupon findForAdmin(UUID id) {
        Coupon c = couponRepo.findById(id).orElseThrow(() -> ApiException.notFound("Coupon not found"));
        c.getCategories().size();
        return c;
    }

    /** Resolve the store backing a coupon (for admin detail responses). */
    @Transactional(readOnly = true)
    public Optional<Store> findStore(UUID storeId) {
        return storeRepo.findById(storeId);
    }

    @Transactional(readOnly = true)
    public List<CouponWithStore> findFeaturedWithStores() {
        List<Coupon> coupons = couponRepo.findFeatured(OffsetDateTime.now());
        if (coupons.isEmpty()) return List.of();
        coupons.forEach(c -> c.getCategories().size());
        Set<UUID> storeIds = new HashSet<>();
        for (Coupon c : coupons) storeIds.add(c.getStoreId());
        Map<UUID, Store> map = new HashMap<>();
        for (Store s : storeRepo.findAllById(storeIds)) map.put(s.getId(), s);
        return coupons.stream().map(c -> new CouponWithStore(c, map.get(c.getStoreId()))).toList();
    }

    @Transactional(readOnly = true)
    public List<Coupon> findFeatured() {
        List<Coupon> coupons = couponRepo.findFeatured(OffsetDateTime.now());
        coupons.forEach(c -> c.getCategories().size());
        return coupons;
    }

    @CacheEvict(cacheNames = {"coupon.detail", "homepage.top", "homepage.layout"}, allEntries = true)
    @Transactional
    public void setFeatured(List<SlugPosition> assignments) {
        for (Coupon c : couponRepo.findFeatured(OffsetDateTime.now())) {
            c.setFeatured(false);
            c.setFeaturedPosition(null);
        }
        if (assignments == null || assignments.isEmpty()) return;
        for (SlugPosition a : assignments) {
            couponRepo.findBySlugAndDeletedAtIsNull(a.slug()).ifPresent(c -> {
                c.setFeatured(true);
                c.setFeaturedPosition(a.position());
            });
        }
        audit.record("COUPONS_FEATURED_SET", "coupon", null,
                Map.of("count", assignments.size()));
    }

    public record SlugPosition(String slug, int position) {}

    // ---- Bulk admin actions ------------------------------------------------

    public enum BulkAction { DEACTIVATE, RESTORE, VERIFY, UNVERIFY, FEATURE, UNFEATURE }

    public record BulkResult(int matched, int updated) {}

    public record ImportRow(int line, String slug, String error) {}

    public record ImportResult(int created, int updated, int skipped, java.util.List<ImportRow> errors) {}

    /**
     * CSV columns (header required, order flexible):
     *   storeSlug, type, title, description
     *   slug, code, savingsLabel, expiresAt (ISO-8601),
     *   verified (true/false), exclusive (true/false), terms,
     *   metaTitle, metaDescription, categorySlugs (pipe-separated)
     *
     * Existing rows are matched by slug (or storeSlug+slugified-title) and
     * updated in place. Anything else is created.
     */
    @CacheEvict(cacheNames = {"coupon.detail", "store.detail", "homepage.top", "homepage.layout"}, allEntries = true)
    @Transactional
    public ImportResult importCsv(java.io.Reader reader) throws java.io.IOException {
        java.util.List<String[]> rows = readCsv(reader);
        if (rows.isEmpty()) return new ImportResult(0, 0, 0, java.util.List.of());
        String[] header = rows.get(0);
        java.util.Map<String, Integer> col = new java.util.HashMap<>();
        for (int i = 0; i < header.length; i++) col.put(header[i].trim(), i);

        java.util.List<ImportRow> errors = new java.util.ArrayList<>();
        int created = 0, updated = 0, skipped = 0;
        for (int line = 1; line < rows.size(); line++) {
            String[] r = rows.get(line);
            try {
                String storeSlug = field(r, col, "storeSlug");
                String typeStr = field(r, col, "type");
                String title = field(r, col, "title");
                String description = field(r, col, "description");
                if (storeSlug == null || typeStr == null || title == null || description == null) {
                    errors.add(new ImportRow(line + 1, null,
                            "missing required field (storeSlug/type/title/description)"));
                    continue;
                }
                Store store = storeRepo.findBySlugAndDeletedAtIsNull(storeSlug)
                        .orElse(null);
                if (store == null) {
                    errors.add(new ImportRow(line + 1, null, "unknown storeSlug: " + storeSlug));
                    continue;
                }
                CouponType type;
                try {
                    type = CouponType.valueOf(typeStr);
                } catch (IllegalArgumentException ex) {
                    errors.add(new ImportRow(line + 1, null, "unknown type: " + typeStr));
                    continue;
                }

                String slug = field(r, col, "slug");
                if (slug == null || slug.isBlank()) slug = Slugifier.compose(store.getSlug(), title);
                else slug = Slugifier.slugify(slug);

                String code = field(r, col, "code");
                String savingsLabel = field(r, col, "savingsLabel");
                String terms = field(r, col, "terms");
                String metaTitle = field(r, col, "metaTitle");
                String metaDescription = field(r, col, "metaDescription");
                java.time.OffsetDateTime expiresAt = parseDate(field(r, col, "expiresAt"));
                Boolean verified = parseBool(field(r, col, "verified"));
                Boolean exclusive = parseBool(field(r, col, "exclusive"));
                java.util.List<String> categorySlugs =
                        splitPipes(field(r, col, "categorySlugs"));

                Coupon existing = couponRepo.findBySlugAndDeletedAtIsNull(slug).orElse(null);
                if (existing == null) {
                    Coupon c = Coupon.create(slug, store.getId(), type, title, description);
                    applyMutableFields(c, code, terms, savingsLabel, null, null,
                            null, expiresAt, verified, exclusive, null,
                            null, metaTitle, metaDescription);
                    if (!categorySlugs.isEmpty()) {
                        c.setCategories(resolveCategories(categorySlugs));
                    }
                    couponRepo.save(c);
                    created++;
                } else {
                    existing.setTitle(title);
                    existing.setDescription(description);
                    existing.setType(type);
                    applyMutableFields(existing, code, terms, savingsLabel, null, null,
                            null, expiresAt, verified, exclusive, null,
                            null, metaTitle, metaDescription);
                    if (!categorySlugs.isEmpty()) {
                        existing.setCategories(resolveCategories(categorySlugs));
                    }
                    updated++;
                }
            } catch (Exception ex) {
                errors.add(new ImportRow(line + 1, null, ex.getMessage()));
            }
        }
        audit.record("COUPONS_IMPORT", "coupon", null,
                java.util.Map.of("created", created, "updated", updated,
                        "skipped", skipped, "errors", errors.size()));
        return new ImportResult(created, updated, skipped, errors);
    }

    // ---- CSV helpers (RFC-4180-ish; quoted values, escaped quotes) -------

    private static String field(String[] row, java.util.Map<String, Integer> col, String name) {
        Integer i = col.get(name);
        if (i == null || i >= row.length) return null;
        String v = row[i];
        return (v == null || v.isBlank()) ? null : v.trim();
    }

    private static Boolean parseBool(String v) {
        if (v == null) return null;
        v = v.trim().toLowerCase();
        return v.equals("true") || v.equals("1") || v.equals("yes")
                ? Boolean.TRUE
                : (v.equals("false") || v.equals("0") || v.equals("no") ? Boolean.FALSE : null);
    }

    private static java.time.OffsetDateTime parseDate(String v) {
        if (v == null) return null;
        try { return java.time.OffsetDateTime.parse(v); } catch (Exception ignored) {}
        try { return java.time.LocalDate.parse(v).atTime(23, 59, 59).atOffset(java.time.ZoneOffset.UTC); }
        catch (Exception ignored) {}
        return null;
    }

    private static java.util.List<String> splitPipes(String v) {
        if (v == null || v.isBlank()) return java.util.List.of();
        java.util.List<String> out = new java.util.ArrayList<>();
        for (String part : v.split("\\|")) {
            String t = part.trim();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    private static java.util.List<String[]> readCsv(java.io.Reader reader) throws java.io.IOException {
        java.util.List<String[]> rows = new java.util.ArrayList<>();
        java.util.List<String> currentRow = new java.util.ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean inQuotes = false;
        int ch;
        while ((ch = reader.read()) != -1) {
            char c = (char) ch;
            if (inQuotes) {
                if (c == '"') {
                    int next = reader.read();
                    if (next == '"') {
                        field.append('"');
                    } else {
                        inQuotes = false;
                        if (next == -1) break;
                        // re-handle the next character
                        c = (char) next;
                        // fall through to outer logic by jumping
                        if (c == ',') {
                            currentRow.add(field.toString());
                            field.setLength(0);
                        } else if (c == '\n') {
                            currentRow.add(field.toString());
                            field.setLength(0);
                            rows.add(currentRow.toArray(new String[0]));
                            currentRow = new java.util.ArrayList<>();
                        } else if (c != '\r') {
                            field.append(c);
                        }
                    }
                } else {
                    field.append(c);
                }
            } else {
                if (c == '"' && field.length() == 0) {
                    inQuotes = true;
                } else if (c == ',') {
                    currentRow.add(field.toString());
                    field.setLength(0);
                } else if (c == '\n') {
                    currentRow.add(field.toString());
                    field.setLength(0);
                    rows.add(currentRow.toArray(new String[0]));
                    currentRow = new java.util.ArrayList<>();
                } else if (c != '\r') {
                    field.append(c);
                }
            }
        }
        if (field.length() > 0 || !currentRow.isEmpty()) {
            currentRow.add(field.toString());
            rows.add(currentRow.toArray(new String[0]));
        }
        return rows;
    }

    @CacheEvict(cacheNames = {"coupon.detail", "store.detail", "homepage.top", "homepage.layout"}, allEntries = true)
    @Transactional
    public BulkResult bulk(BulkAction action, List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return new BulkResult(0, 0);
        List<Coupon> rows = couponRepo.findAllById(ids);
        int matched = rows.size();
        int updated = 0;
        for (Coupon c : rows) {
            switch (action) {
                case DEACTIVATE -> {
                    if (c.getStatus() != CouponStatus.DELETED) {
                        c.softDelete();
                        updated++;
                    }
                }
                case RESTORE -> {
                    if (c.getStatus() == CouponStatus.DELETED) {
                        c.restore();
                        updated++;
                    }
                }
                case VERIFY -> {
                    if (!c.isVerified()) { c.setVerified(true); updated++; }
                }
                case UNVERIFY -> {
                    if (c.isVerified()) { c.setVerified(false); updated++; }
                }
                case FEATURE -> {
                    if (!c.isFeatured()) { c.setFeatured(true); updated++; }
                }
                case UNFEATURE -> {
                    if (c.isFeatured()) {
                        c.setFeatured(false);
                        c.setFeaturedPosition(null);
                        updated++;
                    }
                }
            }
        }
        audit.record("COUPONS_BULK", "coupon", null,
                Map.of("action", action.name(), "matched", matched, "updated", updated));
        return new BulkResult(matched, updated);
    }

    @CacheEvict(cacheNames = {"coupon.detail", "store.detail", "homepage.top", "homepage.layout"}, allEntries = true)
    @Transactional
    public Coupon create(CreateCouponCommand cmd) {
        Store store = storeRepo.findById(cmd.storeId())
                .orElseThrow(() -> ApiException.notFound("Store not found"));
        String slug = (cmd.slug() == null || cmd.slug().isBlank())
                ? Slugifier.compose(store.getSlug(), cmd.title())
                : Slugifier.slugify(cmd.slug());
        if (slug.isBlank()) {
            throw new ApiException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_SLUG", "Cannot derive a slug from the title");
        }
        if (couponRepo.existsBySlug(slug)) {
            throw ApiException.conflict("A coupon with this slug already exists");
        }
        Coupon coupon = Coupon.create(slug, cmd.storeId(), cmd.type(), cmd.title(), cmd.description());
        applyMutableFields(coupon, cmd.code(), cmd.terms(), cmd.savingsLabel(),
                cmd.minPurchase(), cmd.minPurchaseCurrency(),
                cmd.startsAt(), cmd.expiresAt(),
                cmd.verified(), cmd.exclusive(), cmd.popularityScore(),
                cmd.affiliateUrlOverride(), cmd.metaTitle(), cmd.metaDescription());
        if (cmd.categorySlugs() != null && !cmd.categorySlugs().isEmpty()) {
            Set<Category> resolved = resolveCategories(cmd.categorySlugs());
            coupon.setCategories(resolved);
        }
        Coupon saved = couponRepo.save(coupon);
        audit.record("COUPON_CREATE", "coupon", saved.getId(), Map.of("slug", slug));
        return saved;
    }

    @CacheEvict(cacheNames = {"coupon.detail", "store.detail", "homepage.top", "homepage.layout"}, allEntries = true)
    @Transactional
    public Coupon update(UUID id, UpdateCouponCommand cmd) {
        Coupon coupon = couponRepo.findById(id).orElseThrow(() -> ApiException.notFound("Coupon not found"));
        if (cmd.slug() != null) {
            String newSlug = Slugifier.slugify(cmd.slug());
            if (!newSlug.equals(coupon.getSlug())) {
                if (couponRepo.existsBySlug(newSlug)) throw ApiException.conflict("Slug already in use");
                coupon.setSlug(newSlug);
            }
        }
        if (cmd.title() != null) coupon.setTitle(cmd.title());
        if (cmd.description() != null) coupon.setDescription(cmd.description());
        if (cmd.type() != null) coupon.setType(cmd.type());
        applyMutableFields(coupon, cmd.code(), cmd.terms(), cmd.savingsLabel(),
                cmd.minPurchase(), cmd.minPurchaseCurrency(),
                cmd.startsAt(), cmd.expiresAt(),
                cmd.verified(), cmd.exclusive(), cmd.popularityScore(),
                cmd.affiliateUrlOverride(), cmd.metaTitle(), cmd.metaDescription());
        if (cmd.status() != null) coupon.setStatus(cmd.status());
        if (cmd.categorySlugs() != null) {
            coupon.setCategories(resolveCategories(cmd.categorySlugs()));
        }
        audit.record("COUPON_UPDATE", "coupon", coupon.getId(), Map.of("slug", coupon.getSlug()));
        return coupon;
    }

    @CacheEvict(cacheNames = {"coupon.detail", "store.detail", "homepage.top", "homepage.layout"}, allEntries = true)
    @Transactional
    public void softDelete(UUID id) {
        Coupon coupon = couponRepo.findById(id).orElseThrow(() -> ApiException.notFound("Coupon not found"));
        coupon.softDelete();
        audit.record("COUPON_DELETE", "coupon", coupon.getId(), Map.of("slug", coupon.getSlug()));
    }

    @CacheEvict(cacheNames = {"coupon.detail", "store.detail", "homepage.top", "homepage.layout"}, allEntries = true)
    @Transactional
    public void restore(UUID id) {
        Coupon coupon = couponRepo.findById(id).orElseThrow(() -> ApiException.notFound("Coupon not found"));
        coupon.restore();
        audit.record("COUPON_RESTORE", "coupon", coupon.getId(), Map.of("slug", coupon.getSlug()));
    }

    private Set<Category> resolveCategories(List<String> slugs) {
        Set<Category> result = new LinkedHashSet<>();
        Set<String> missing = new HashSet<>();
        for (String slug : slugs) {
            if (slug == null || slug.isBlank()) continue;
            Optional<Category> c = categoryRepo.findBySlug(Slugifier.slugify(slug));
            if (c.isPresent()) result.add(c.get());
            else missing.add(slug);
        }
        if (!missing.isEmpty()) {
            throw new ApiException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "UNKNOWN_CATEGORY", "Unknown category slug(s): " + String.join(", ", missing));
        }
        return result;
    }

    private static void applyMutableFields(Coupon c, String code, String terms, String savingsLabel,
                                           BigDecimal minPurchase, String minPurchaseCurrency,
                                           OffsetDateTime startsAt, OffsetDateTime expiresAt,
                                           Boolean verified, Boolean exclusive, Integer popularityScore,
                                           String affiliateUrlOverride, String metaTitle, String metaDescription) {
        if (code != null) c.setCode(code.isBlank() ? null : code);
        if (terms != null) c.setTerms(terms);
        if (savingsLabel != null) c.setSavingsLabel(savingsLabel);
        if (minPurchase != null) c.setMinPurchase(minPurchase);
        if (minPurchaseCurrency != null) c.setMinPurchaseCurrency(minPurchaseCurrency);
        if (startsAt != null) c.setStartsAt(startsAt);
        if (expiresAt != null) c.setExpiresAt(expiresAt);
        if (verified != null) c.setVerified(verified);
        if (exclusive != null) c.setExclusive(exclusive);
        if (popularityScore != null) c.setPopularityScore(popularityScore);
        if (affiliateUrlOverride != null) c.setAffiliateUrlOverride(affiliateUrlOverride);
        if (metaTitle != null) c.setMetaTitle(metaTitle);
        if (metaDescription != null) c.setMetaDescription(metaDescription);
    }

    public record CouponDetail(Coupon coupon, Store store) {}

    public record CreateCouponCommand(
            UUID storeId, String slug, CouponType type, String code,
            String title, String description, String terms, String savingsLabel,
            BigDecimal minPurchase, String minPurchaseCurrency,
            OffsetDateTime startsAt, OffsetDateTime expiresAt,
            Boolean verified, Boolean exclusive, Integer popularityScore,
            String affiliateUrlOverride, String metaTitle, String metaDescription,
            List<String> categorySlugs) {}

    public record UpdateCouponCommand(
            String slug, CouponType type, String code,
            String title, String description, String terms, String savingsLabel,
            BigDecimal minPurchase, String minPurchaseCurrency,
            OffsetDateTime startsAt, OffsetDateTime expiresAt,
            CouponStatus status,
            Boolean verified, Boolean exclusive, Integer popularityScore,
            String affiliateUrlOverride, String metaTitle, String metaDescription,
            List<String> categorySlugs) {}
}
