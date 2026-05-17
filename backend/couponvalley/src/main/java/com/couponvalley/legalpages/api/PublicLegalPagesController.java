package com.couponvalley.legalpages.api;

import com.couponvalley.common.error.ApiException;
import com.couponvalley.legalpages.api.dto.LegalPageDtos;
import com.couponvalley.legalpages.application.LegalPageService;
import com.couponvalley.legalpages.domain.LegalPage;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/legal-pages", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "legal-pages", description = "Public read-only access to legal copy")
public class PublicLegalPagesController {

    private final LegalPageService service;

    public PublicLegalPagesController(LegalPageService service) {
        this.service = service;
    }

    @GetMapping("/{slug}")
    public LegalPageDtos.Detail get(@PathVariable String slug) {
        LegalPage page = service.findBySlug(slug);
        if (page == null) throw ApiException.notFound("Legal page not found: " + slug);
        return LegalPageDtos.Detail.from(page);
    }
}
