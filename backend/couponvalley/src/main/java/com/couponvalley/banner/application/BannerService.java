package com.couponvalley.banner.application;

import com.couponvalley.banner.domain.Banner;
import com.couponvalley.banner.domain.BannerPlacement;
import com.couponvalley.banner.infra.BannerRepository;
import com.couponvalley.common.audit.AuditLogService;
import com.couponvalley.common.error.ApiException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BannerService {

    private final BannerRepository repo;
    private final AuditLogService audit;

    public BannerService(BannerRepository repo, AuditLogService audit) {
        this.repo = repo;
        this.audit = audit;
    }

    @Cacheable(cacheNames = "homepage.top", key = "'banners:' + (#country == null ? 'GLOBAL' : #country) + ':' + (#placement == null ? 'ALL' : #placement.name())")
    @Transactional(readOnly = true)
    public List<Banner> live(String country, BannerPlacement placement) {
        return repo.findLive(OffsetDateTime.now(), country, placement);
    }

    /** Backward-compatible overload. Equivalent to live(country, null) — returns all placements. */
    public List<Banner> live(String country) {
        return live(country, null);
    }

    @Transactional(readOnly = true)
    public List<Banner> adminList() {
        return repo.findAllByOrderByPositionAsc();
    }

    @CacheEvict(cacheNames = "homepage.top", allEntries = true)
    @Transactional
    public Banner create(String title, String subtitle, String imageUrl, String linkUrl,
                         Short position, OffsetDateTime startsAt, OffsetDateTime endsAt,
                         Boolean active, String countryCode, BannerPlacement placement) {
        Banner b = Banner.create(title, imageUrl, linkUrl, position == null ? 0 : position);
        b.setSubtitle(subtitle);
        b.setStartsAt(startsAt);
        b.setEndsAt(endsAt);
        if (active != null) b.setActive(active);
        b.setCountryCode(countryCode);
        if (placement != null) b.setPlacement(placement);
        Banner saved = repo.save(b);
        audit.record("BANNER_CREATE", "banner", saved.getId(), Map.of("title", title));
        return saved;
    }

    @CacheEvict(cacheNames = "homepage.top", allEntries = true)
    @Transactional
    public Banner update(UUID id, String title, String subtitle, String imageUrl, String linkUrl,
                         Short position, OffsetDateTime startsAt, OffsetDateTime endsAt,
                         Boolean active, String countryCode, BannerPlacement placement) {
        Banner b = repo.findById(id).orElseThrow(() -> ApiException.notFound("Banner not found"));
        if (title != null) b.setTitle(title);
        if (subtitle != null) b.setSubtitle(subtitle);
        if (imageUrl != null) b.setImageUrl(imageUrl);
        if (linkUrl != null) b.setLinkUrl(linkUrl);
        if (position != null) b.setPosition(position);
        if (startsAt != null) b.setStartsAt(startsAt);
        if (endsAt != null) b.setEndsAt(endsAt);
        if (active != null) b.setActive(active);
        if (countryCode != null) b.setCountryCode(countryCode);
        if (placement != null) b.setPlacement(placement);
        audit.record("BANNER_UPDATE", "banner", b.getId(), Map.of());
        return b;
    }

    @CacheEvict(cacheNames = "homepage.top", allEntries = true)
    @Transactional
    public void delete(UUID id) {
        Banner b = repo.findById(id).orElseThrow(() -> ApiException.notFound("Banner not found"));
        repo.delete(b);
        audit.record("BANNER_DELETE", "banner", id, Map.of());
    }

    /**
     * Bulk re-order banners. Each id in {@code orderedIds} gets a fresh position
     * (0..N-1). Any banner not in the list keeps its relative order pushed to
     * the tail. Used by the admin drag-reorder UI on /admin/banners.
     */
    @CacheEvict(cacheNames = "homepage.top", allEntries = true)
    @Transactional
    public void reorder(List<UUID> orderedIds) {
        List<Banner> all = repo.findAllByOrderByPositionAsc();
        java.util.Map<UUID, Banner> byId = new java.util.HashMap<>();
        for (Banner b : all) byId.put(b.getId(), b);
        short pos = 0;
        for (UUID id : orderedIds) {
            Banner b = byId.get(id);
            if (b == null) continue;
            b.setPosition(pos++);
        }
        short tail = pos;
        for (Banner b : all) {
            if (!orderedIds.contains(b.getId())) b.setPosition(tail++);
        }
        audit.record("BANNER_REORDER", "banner", null, Map.of("count", orderedIds.size()));
    }
}
