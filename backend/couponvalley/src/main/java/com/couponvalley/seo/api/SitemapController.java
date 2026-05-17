package com.couponvalley.seo.api;

import com.couponvalley.seo.application.SitemapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * Phase 1 sitemap surface. Generates XML on-demand directly from Postgres.
 * When the catalog grows past a single 50k-URL chunk we promote this to a
 * scheduled job that uploads gzipped sitemaps to R2; for now the inline
 * approach keeps infra cost at zero and CDN caches each fetch for 10 minutes.
 */
@RestController
@Tag(name = "seo", description = "Sitemap and SEO endpoints")
@SecurityRequirements
public class SitemapController {

    private static final String XML = "application/xml; charset=UTF-8";

    private final SitemapService sitemapService;

    public SitemapController(SitemapService sitemapService) {
        this.sitemapService = sitemapService;
    }

    @GetMapping(path = "/sitemap.xml", produces = XML)
    @Operation(summary = "Sitemap index — links to per-type sitemaps")
    public ResponseEntity<String> index() {
        return cache(sitemapService.renderIndex());
    }

    @GetMapping(path = "/sitemaps/{type}.xml", produces = XML)
    @Operation(summary = "Per-type sitemap (stores, coupons, categories)")
    public ResponseEntity<String> sitemap(@PathVariable String type) {
        return cache(sitemapService.renderSection(type));
    }

    @GetMapping(path = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    @Operation(summary = "Robots policy")
    public ResponseEntity<String> robots() {
        String body = sitemapService.renderRobots();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofHours(6)).cachePublic())
                .contentType(MediaType.TEXT_PLAIN)
                .body(body);
    }

    private static ResponseEntity<String> cache(String body) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(10))
                        .cachePublic()
                        .staleWhileRevalidate(Duration.ofMinutes(30)))
                .contentType(MediaType.parseMediaType(XML))
                .body(body);
    }
}
