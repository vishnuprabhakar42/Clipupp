package com.clipupp.campaigns.application;

import com.clipupp.campaigns.api.dto.CampaignDtos;
import com.clipupp.campaigns.domain.Campaign;
import com.clipupp.campaigns.infra.CampaignRepository;
import com.clipupp.common.audit.AuditLogService;
import com.clipupp.common.error.ApiException;
import com.clipupp.common.text.Slugifier;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CampaignService {

    private final CampaignRepository repo;
    private final AuditLogService audit;

    public CampaignService(CampaignRepository repo, AuditLogService audit) {
        this.repo = repo;
        this.audit = audit;
    }

    @Cacheable(cacheNames = "campaigns.active", key = "'now'", unless = "#result == null")
    @Transactional(readOnly = true)
    public Campaign findActive() {
        // Several campaigns can overlap (the homepage shows two); the newest start wins.
        return repo.findActiveAt(OffsetDateTime.now(), PageRequest.of(0, 1)).stream().findFirst().orElse(null);
    }

    /** Up to {@code limit} active campaigns, newest start first. Feeds the homepage bank/festive tiles. */
    @Cacheable(cacheNames = "campaigns.active", key = "'list:' + #limit", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Campaign> findActive(int limit) {
        int capped = Math.max(1, Math.min(limit, 10));
        return repo.findActiveAt(OffsetDateTime.now(), PageRequest.of(0, capped));
    }

    @Transactional(readOnly = true)
    public List<Campaign> listAll() {
        return repo.findAllOrdered();
    }

    @Transactional(readOnly = true)
    public Campaign findById(UUID id) {
        return repo.findById(id).orElseThrow(() -> ApiException.notFound("Campaign not found"));
    }

    @CacheEvict(cacheNames = {"campaigns.active", "homepage.layout"}, allEntries = true)
    @Transactional
    public Campaign create(CampaignDtos.Create input) {
        if (input.endsAt().isBefore(input.startsAt())) {
            throw new ApiException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_WINDOW", "endsAt must be after startsAt");
        }
        String slug = (input.slug() == null || input.slug().isBlank())
                ? Slugifier.slugify(input.name())
                : Slugifier.slugify(input.slug());
        if (slug.isBlank()) {
            throw new ApiException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_SLUG", "Cannot derive a slug");
        }
        if (repo.existsBySlug(slug)) {
            throw ApiException.conflict("Campaign slug already in use");
        }
        Campaign c = Campaign.create(slug, input.name(), input.startsAt(), input.endsAt());
        applyMutable(c, input.description(), input.active(),
                input.heroTitle(), input.heroSubtitle(), input.heroImageUrl(),
                input.ctaLabel(), input.ctaUrl(), input.themeColor(), input.bannerId(),
                input.pinnedStoreIds(), input.pinnedCouponIds());
        Campaign saved = repo.save(c);
        audit.record("CAMPAIGN_CREATE", "campaign", saved.getId(), Map.of("slug", slug));
        return saved;
    }

    @CacheEvict(cacheNames = {"campaigns.active", "homepage.layout"}, allEntries = true)
    @Transactional
    public Campaign update(UUID id, CampaignDtos.Update input) {
        Campaign c = findById(id);
        if (input.slug() != null) {
            String s = Slugifier.slugify(input.slug());
            if (!s.equals(c.getSlug())) {
                if (repo.existsBySlug(s)) throw ApiException.conflict("Slug already in use");
                c.setSlug(s);
            }
        }
        if (input.name() != null) c.setName(input.name());
        if (input.startsAt() != null) c.setStartsAt(input.startsAt());
        if (input.endsAt() != null) c.setEndsAt(input.endsAt());
        if (c.getEndsAt().isBefore(c.getStartsAt())) {
            throw new ApiException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_WINDOW", "endsAt must be after startsAt");
        }
        applyMutable(c, input.description(), input.active(),
                input.heroTitle(), input.heroSubtitle(), input.heroImageUrl(),
                input.ctaLabel(), input.ctaUrl(), input.themeColor(), input.bannerId(),
                input.pinnedStoreIds(), input.pinnedCouponIds());
        audit.record("CAMPAIGN_UPDATE", "campaign", c.getId(), Map.of("slug", c.getSlug()));
        return c;
    }

    @CacheEvict(cacheNames = {"campaigns.active", "homepage.layout"}, allEntries = true)
    @Transactional
    public Campaign activate(UUID id) {
        Campaign c = findById(id);
        c.setActive(true);
        audit.record("CAMPAIGN_ACTIVATE", "campaign", c.getId(), Map.of("slug", c.getSlug()));
        return c;
    }

    @CacheEvict(cacheNames = {"campaigns.active", "homepage.layout"}, allEntries = true)
    @Transactional
    public void delete(UUID id) {
        Campaign c = findById(id);
        repo.delete(c);
        audit.record("CAMPAIGN_DELETE", "campaign", id, Map.of("slug", c.getSlug()));
    }

    private static void applyMutable(Campaign c,
                                     String description,
                                     Boolean active,
                                     String heroTitle, String heroSubtitle, String heroImageUrl,
                                     String ctaLabel, String ctaUrl,
                                     String themeColor, UUID bannerId,
                                     List<UUID> pinnedStoreIds, List<UUID> pinnedCouponIds) {
        if (description != null) c.setDescription(description.isBlank() ? null : description);
        if (active != null) c.setActive(active);
        if (heroTitle != null) c.setHeroTitle(heroTitle.isBlank() ? null : heroTitle);
        if (heroSubtitle != null) c.setHeroSubtitle(heroSubtitle.isBlank() ? null : heroSubtitle);
        if (heroImageUrl != null) c.setHeroImageUrl(heroImageUrl.isBlank() ? null : heroImageUrl);
        if (ctaLabel != null) c.setCtaLabel(ctaLabel.isBlank() ? null : ctaLabel);
        if (ctaUrl != null) c.setCtaUrl(ctaUrl.isBlank() ? null : ctaUrl);
        if (themeColor != null) c.setThemeColor(themeColor.isBlank() ? null : themeColor);
        if (bannerId != null) c.setBannerId(bannerId);
        if (pinnedStoreIds != null) c.setPinnedStoreIds(pinnedStoreIds.toArray(new UUID[0]));
        if (pinnedCouponIds != null) c.setPinnedCouponIds(pinnedCouponIds.toArray(new UUID[0]));
    }
}
