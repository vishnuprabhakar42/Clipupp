package com.couponvalley.coupons.api;

import com.couponvalley.common.error.ApiException;
import com.couponvalley.common.pagination.CursorPage;
import com.couponvalley.coupons.api.dto.CouponDetailResponse;
import com.couponvalley.coupons.api.dto.CouponSummary;
import com.couponvalley.coupons.application.CouponService;
import com.couponvalley.coupons.domain.CouponType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/coupons", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "coupons", description = "Public coupon catalog")
@SecurityRequirements
public class PublicCouponsController {

    private final CouponService couponService;

    public PublicCouponsController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    @Operation(summary = "List active coupons (cursor pagination)")
    public ResponseEntity<CursorPage<CouponSummary>> list(
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) Set<CouponType> types,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit) {

        CursorPage<com.couponvalley.coupons.domain.Coupon> page;
        if (category != null && !category.isBlank()) {
            page = couponService.listByCategory(category, cursor, limit);
        } else {
            page = couponService.list(storeId, types, true, cursor, limit);
        }
        CursorPage<CouponSummary> body = new CursorPage<>(
                page.data().stream().map(CouponSummary::from).toList(), page.page());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofSeconds(30))
                        .cachePublic()
                        .staleWhileRevalidate(java.time.Duration.ofMinutes(2)))
                .body(body);
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get a single coupon by slug")
    public ResponseEntity<CouponDetailResponse> bySlug(@PathVariable String slug) {
        CouponService.CouponDetail detail = couponService.findActiveBySlug(slug);
        if (detail == null) throw ApiException.notFound("Coupon not found");
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofSeconds(60))
                        .cachePublic()
                        .staleWhileRevalidate(java.time.Duration.ofMinutes(5))
                        .mustRevalidate())
                .body(CouponDetailResponse.from(detail));
    }

    @GetMapping("/top")
    @Operation(summary = "Top coupons across the catalog (for homepage rails)")
    public ResponseEntity<java.util.List<CouponSummary>> top(
            @RequestParam(defaultValue = "12") int limit) {
        var enriched = couponService.homepageTopWithStores(Math.min(Math.max(1, limit), 50));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(1)).cachePublic()
                        .staleWhileRevalidate(java.time.Duration.ofMinutes(5)))
                .body(enriched.stream().map(e -> CouponSummary.from(e.coupon(), e.store())).toList());
    }

    @GetMapping("/top-slugs")
    @Operation(summary = "Top-N coupon slugs by popularity (for SSG pre-render at build time)")
    public ResponseEntity<java.util.List<String>> topSlugs(@RequestParam(defaultValue = "200") int limit) {
        java.util.List<String> slugs = couponService.topSlugs(limit);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePublic()
                        .staleWhileRevalidate(java.time.Duration.ofHours(6)))
                .body(slugs);
    }
}
