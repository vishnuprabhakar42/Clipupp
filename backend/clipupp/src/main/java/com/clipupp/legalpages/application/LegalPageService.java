package com.clipupp.legalpages.application;

import com.clipupp.common.audit.AuditLogService;
import com.clipupp.common.error.ApiException;
import com.clipupp.legalpages.domain.LegalPage;
import com.clipupp.legalpages.infra.LegalPageRepository;
import java.util.List;
import java.util.Map;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LegalPageService {

    private final LegalPageRepository repo;
    private final AuditLogService audit;

    public LegalPageService(LegalPageRepository repo, AuditLogService audit) {
        this.repo = repo;
        this.audit = audit;
    }

    @Cacheable(cacheNames = "legal.page", key = "#slug", unless = "#result == null")
    @Transactional(readOnly = true)
    public LegalPage findBySlug(String slug) {
        return repo.findById(slug).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<LegalPage> listAll() {
        return repo.findAll();
    }

    @CacheEvict(cacheNames = "legal.page", key = "#slug")
    @Transactional
    public LegalPage update(String slug, String title, String bodyMd, String metaTitle, String metaDescription) {
        LegalPage page = repo.findById(slug)
                .orElseThrow(() -> ApiException.notFound("Legal page not found: " + slug));
        page.setTitle(title);
        page.setBodyMd(bodyMd);
        page.setMetaTitle(metaTitle);
        page.setMetaDescription(metaDescription);
        audit.record("LEGAL_PAGE_UPDATE", "legal_page", null, Map.of("slug", slug));
        return page;
    }
}
