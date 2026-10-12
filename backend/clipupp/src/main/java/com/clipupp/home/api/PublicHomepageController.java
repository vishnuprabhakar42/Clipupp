package com.clipupp.home.api;

import com.clipupp.home.api.dto.PublicHomepageDtos.HomepageLayout;
import com.clipupp.home.application.HomepageResolver;
import com.clipupp.home.application.HomepageService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Resolved homepage in a single round-trip. The whole payload is cached under
 * homepage.layout; every catalog, campaign or settings write evicts it.
 */
@RestController
@RequestMapping(path = "/api/v1/homepage", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "homepage", description = "Public homepage layout")
public class PublicHomepageController {

    private final HomepageService homepageService;
    private final HomepageResolver resolver;

    public PublicHomepageController(HomepageService homepageService, HomepageResolver resolver) {
        this.homepageService = homepageService;
        this.resolver = resolver;
    }

    @GetMapping
    @Cacheable(cacheNames = "homepage.layout", key = "'public.layout'", unless = "#result == null")
    public HomepageLayout layout() {
        return resolver.resolve(homepageService.listEnabledOrdered());
    }
}
