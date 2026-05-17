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
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * "Offers" surface = coupons of type DEAL or FREE_SHIPPING — i.e. the
 * non-code promotions. Backed by the same service as /coupons; this
 * controller simply pre-applies the type filter for SEO and discoverability.
 */
@RestController
@RequestMapping(path = "/api/v1/offers", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "offers", description = "Public deals catalog (no-code promotions)")
@SecurityRequirements
public class PublicOffersController {

    private static final Set<CouponType> OFFER_TYPES = Set.of(CouponType.DEAL, CouponType.FREE_SHIPPING);

    private final CouponService couponService;

    public PublicOffersController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    @Operation(summary = "List active offers (deal + free-shipping, no codes)")
    public ResponseEntity<CursorPage<CouponSummary>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit) {
        CursorPage<com.couponvalley.coupons.domain.Coupon> page;
        if (category != null && !category.isBlank()) {
            page = couponService.listByCategory(category, cursor, limit);
        } else {
            page = couponService.list(null, OFFER_TYPES, true, cursor, limit);
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
    @Operation(summary = "Get a single offer by slug")
    public ResponseEntity<CouponDetailResponse> bySlug(@PathVariable String slug) {
        CouponService.CouponDetail detail = couponService.findActiveBySlug(slug);
        if (detail == null || !OFFER_TYPES.contains(detail.coupon().getType())) {
            throw ApiException.notFound("Offer not found");
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofSeconds(60))
                        .cachePublic()
                        .staleWhileRevalidate(java.time.Duration.ofMinutes(5))
                        .mustRevalidate())
                .body(CouponDetailResponse.from(detail));
    }
}
