package com.couponvalley.stores.api;

import com.couponvalley.common.error.ApiException;
import com.couponvalley.common.pagination.CursorPage;
import com.couponvalley.coupons.api.dto.CouponSummary;
import com.couponvalley.stores.api.dto.StoreDetailResponse;
import com.couponvalley.stores.api.dto.StoreSummary;
import com.couponvalley.stores.application.StoreService;
import com.couponvalley.stores.domain.Store;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/stores", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "stores", description = "Public store catalog")
@SecurityRequirements
public class PublicStoresController {

    private final StoreService storeService;

    public PublicStoresController(StoreService storeService) {
        this.storeService = storeService;
    }

    @GetMapping
    @Operation(summary = "List active stores (cursor pagination)")
    public ResponseEntity<CursorPage<StoreSummary>> list(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit) {
        CursorPage<Store> page = (category != null && !category.isBlank())
                ? storeService.listByCategory(category, country, cursor, limit)
                : storeService.listActive(country, cursor, limit);
        CursorPage<StoreSummary> body = new CursorPage<>(
                page.data().stream().map(StoreSummary::from).toList(),
                page.page());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(30))
                        .cachePublic()
                        .staleWhileRevalidate(Duration.ofMinutes(2)))
                .body(body);
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get a store by slug (full detail)")
    public ResponseEntity<StoreDetailResponse> bySlug(@PathVariable String slug) {
        StoreService.StoreDetail detail = storeService.findActiveBySlug(slug);
        if (detail == null) throw ApiException.notFound("Store not found");
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(60))
                        .cachePublic()
                        .staleWhileRevalidate(Duration.ofMinutes(5))
                        .mustRevalidate())
                .body(StoreDetailResponse.from(detail));
    }

    @GetMapping("/{slug}/coupons")
    @Operation(summary = "Active coupons for a given store, paginated")
    public ResponseEntity<CursorPage<CouponSummary>> coupons(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        StoreService.StoreDetail detail = storeService.findActiveBySlug(slug);
        if (detail == null) throw ApiException.notFound("Store not found");
        Page<com.couponvalley.coupons.domain.Coupon> result = storeService.listCouponsForStore(
                detail.store().getId(), Math.max(0, page), Math.max(1, Math.min(size, 100)));
        CursorPage<CouponSummary> body = CursorPage.from(result, CouponSummary::from);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(30)).cachePublic()
                        .staleWhileRevalidate(Duration.ofMinutes(2)))
                .body(body);
    }

    @GetMapping("/{slug}/similar")
    @Operation(summary = "Stores similar to this one (same categories)")
    public ResponseEntity<List<StoreSummary>> similar(
            @PathVariable String slug,
            @RequestParam(defaultValue = "8") int limit) {
        StoreService.StoreDetail detail = storeService.findActiveBySlug(slug);
        if (detail == null) throw ApiException.notFound("Store not found");
        List<Store> similar = storeService.findSimilar(detail.store().getId(), Math.min(Math.max(1, limit), 24));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(2)).cachePublic())
                .body(similar.stream().map(StoreSummary::from).toList());
    }
}
