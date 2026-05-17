package com.couponvalley.admin.api;

import com.couponvalley.common.error.ApiException;
import com.couponvalley.legalpages.api.dto.LegalPageDtos;
import com.couponvalley.legalpages.application.LegalPageService;
import com.couponvalley.legalpages.domain.LegalPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/admin/legal-pages", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/legal-pages", description = "Edit body + meta of fixed-slug legal pages")
public class AdminLegalPagesController {

    private final LegalPageService service;

    public AdminLegalPagesController(LegalPageService service) {
        this.service = service;
    }

    @GetMapping
    public List<LegalPageDtos.Summary> list() {
        return service.listAll().stream().map(LegalPageDtos.Summary::from).toList();
    }

    @GetMapping("/{slug}")
    public LegalPageDtos.Detail get(@PathVariable String slug) {
        LegalPage page = service.findBySlug(slug);
        if (page == null) throw ApiException.notFound("Legal page not found: " + slug);
        return LegalPageDtos.Detail.from(page);
    }

    @PatchMapping(value = "/{slug}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Update body, title and meta of a fixed-slug legal page")
    public LegalPageDtos.Detail update(@PathVariable String slug,
                                       @RequestBody @Valid LegalPageDtos.Update input) {
        LegalPage updated = service.update(slug, input.title(), input.bodyMd(),
                input.metaTitle(), input.metaDescription());
        return LegalPageDtos.Detail.from(updated);
    }
}
