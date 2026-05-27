package com.couponvalley.settings.application;

import com.couponvalley.common.audit.AuditLogService;
import com.couponvalley.settings.api.dto.Json;
import com.couponvalley.settings.domain.SiteSetting;
import com.couponvalley.settings.infra.SiteSettingRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SiteSettingService {

    /**
     * Allowlist of keys exposed via the public endpoint. Any internal-only
     * keys (admin notes, feature flags, etc.) deliberately skip this list so
     * adding a row to {@code site_setting} doesn't accidentally leak it.
     */
    public static final Set<String> PUBLIC_KEYS = Set.of(
            "brand.name", "brand.tagline", "brand.primary_color", "brand.accent_color", "brand.logo_url",
            "footer.disclosure", "footer.commission_note", "footer.hashtag",
            "social.whatsapp", "social.facebook", "social.x", "social.linkedin", "social.instagram", "social.youtube",
            "contact.email", "contact.phone",
            "contact.address_line1", "contact.address_line2", "contact.address_line3",
            "newsletter.headline", "newsletter.subheadline", "newsletter.cta",
            "seo.default_title_template", "seo.default_description", "seo.og_image",
            // Savings stats strip (V029) — rendered on the public homepage.
            "stats.coupons", "stats.stores", "stats.verified", "stats.savings"
    );

    private final SiteSettingRepository repo;
    private final AuditLogService audit;

    public SiteSettingService(SiteSettingRepository repo, AuditLogService audit) {
        this.repo = repo;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<SiteSetting> listAll() {
        return repo.findAllOrdered();
    }

    @Cacheable(cacheNames = "site.settings.public", key = "'all'", unless = "#result == null")
    @Transactional(readOnly = true)
    public Map<String, Object> publicMap() {
        Map<String, Object> result = new LinkedHashMap<>();
        for (SiteSetting s : repo.findByKeyIn(List.copyOf(PUBLIC_KEYS))) {
            result.put(s.getKey(), Json.parse(s.getValue()));
        }
        return result;
    }

    @CacheEvict(cacheNames = "site.settings.public", allEntries = true)
    @Transactional
    public SiteSetting upsert(String key, Object value) {
        String json = Json.stringify(value);
        SiteSetting existing = repo.findById(key).orElse(null);
        if (existing == null) {
            existing = repo.save(new SiteSetting(key, json));
        } else {
            existing.setValue(json);
        }
        audit.record("SETTING_UPDATE", "site_setting", null, Map.of("key", key));
        return existing;
    }

    @CacheEvict(cacheNames = "site.settings.public", allEntries = true)
    @Transactional
    public List<SiteSetting> upsertAll(Map<String, Object> values) {
        List<SiteSetting> out = new java.util.ArrayList<>(values.size());
        for (Map.Entry<String, Object> e : values.entrySet()) {
            out.add(upsert(e.getKey(), e.getValue()));
        }
        return out;
    }
}
