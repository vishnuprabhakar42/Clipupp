package com.couponvalley.categories.api;

import com.couponvalley.categories.api.dto.CategoryDtos;
import com.couponvalley.categories.application.CategoryService;
import com.couponvalley.common.error.ApiException;
import com.couponvalley.common.pagination.CursorPage;
import com.couponvalley.coupons.api.dto.CouponSummary;
import com.couponvalley.coupons.application.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/categories", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "categories", description = "Public category taxonomy")
@SecurityRequirements
public class PublicCategoriesController {

    private final CategoryService categoryService;
    private final CouponService couponService;

    public PublicCategoriesController(CategoryService categoryService, CouponService couponService) {
        this.categoryService = categoryService;
        this.couponService = couponService;
    }

    @GetMapping
    @Operation(summary = "Full category tree (active categories only)")
    public ResponseEntity<List<CategoryDtos.TreeNode>> tree() {
        List<CategoryDtos.TreeNode> body = categoryService.tree().stream()
                .map(CategoryDtos.TreeNode::from).toList();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(5)).cachePublic()
                        .staleWhileRevalidate(java.time.Duration.ofMinutes(30)))
                .body(body);
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get a single category by slug")
    public ResponseEntity<CategoryDtos.Detail> bySlug(@PathVariable String slug) {
        var c = categoryService.findBySlug(slug)
                .orElseThrow(() -> ApiException.notFound("Category not found"));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(5)).cachePublic())
                .body(CategoryDtos.Detail.from(c));
    }

    @GetMapping("/{slug}/coupons")
    @Operation(summary = "Active coupons in this category")
    public ResponseEntity<CursorPage<CouponSummary>> coupons(
            @PathVariable String slug,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit) {
        // Verify the category exists for a proper 404 (vs returning empty list silently)
        categoryService.findBySlug(slug).orElseThrow(() -> ApiException.notFound("Category not found"));
        var page = couponService.listByCategory(slug, cursor, limit);
        CursorPage<CouponSummary> body = new CursorPage<>(
                page.data().stream().map(CouponSummary::from).toList(), page.page());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofSeconds(60)).cachePublic()
                        .staleWhileRevalidate(java.time.Duration.ofMinutes(5)))
                .body(body);
    }
}
