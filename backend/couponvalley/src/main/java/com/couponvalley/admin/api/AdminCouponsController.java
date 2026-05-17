package com.couponvalley.admin.api;

import com.couponvalley.coupons.api.dto.CouponAdminDetail;
import com.couponvalley.coupons.api.dto.CouponInput;
import com.couponvalley.coupons.api.dto.CouponSummary;
import com.couponvalley.coupons.application.CouponService;
import com.couponvalley.coupons.application.CouponService.BulkAction;
import com.couponvalley.coupons.application.CouponService.BulkResult;
import com.couponvalley.coupons.domain.Coupon;
import com.couponvalley.coupons.domain.CouponStatus;
import com.couponvalley.coupons.domain.CouponType;
import com.couponvalley.stores.domain.Store;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/admin/coupons", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/coupons", description = "Admin coupon CRUD")
public class AdminCouponsController {

    private final CouponService couponService;

    public AdminCouponsController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    @Operation(summary = "List coupons (admin) with optional filters")
    public Page<CouponSummary> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID storeId,
            @RequestParam(required = false) CouponStatus status,
            @RequestParam(required = false) CouponType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        int safeSize = Math.max(1, Math.min(size, 200));
        Page<Coupon> result = couponService.listForAdmin(q, storeId, status, type,
                PageRequest.of(Math.max(0, page), safeSize));

        // Batch-resolve stores so each row has its store info inline (avoids N+1).
        Set<UUID> storeIds = new HashSet<>();
        for (Coupon c : result.getContent()) storeIds.add(c.getStoreId());
        Map<UUID, Store> storeMap = new HashMap<>();
        for (UUID sid : storeIds) couponService.findStore(sid).ifPresent(s -> storeMap.put(sid, s));
        return result.map(c -> CouponSummary.from(c, storeMap.get(c.getStoreId())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Fetch a coupon for editing")
    public CouponAdminDetail get(@PathVariable UUID id) {
        Coupon c = couponService.findForAdmin(id);
        Store s = couponService.findStore(c.getStoreId()).orElse(null);
        return CouponAdminDetail.from(c, s);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Create a coupon for a given store")
    public ResponseEntity<CouponSummary> create(@RequestBody @Valid CouponInput.Create input) {
        Coupon saved = couponService.create(input.toCommand());
        Store s = couponService.findStore(saved.getStoreId()).orElse(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(CouponSummary.from(saved, s));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Update an existing coupon")
    public CouponSummary update(@PathVariable UUID id, @RequestBody @Valid CouponInput.Update input) {
        Coupon updated = couponService.update(id, input.toCommand());
        Store s = couponService.findStore(updated.getStoreId()).orElse(null);
        return CouponSummary.from(updated, s);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a coupon")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        couponService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore a soft-deleted coupon")
    public ResponseEntity<Void> restore(@PathVariable UUID id) {
        couponService.restore(id);
        return ResponseEntity.noContent().build();
    }

    public record BulkRequest(@NotNull BulkAction action, @NotEmpty List<UUID> ids) {}

    @PostMapping(value = "/bulk", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Bulk action on a set of coupons")
    public BulkResult bulk(@RequestBody @Valid BulkRequest req) {
        return couponService.bulk(req.action(), req.ids());
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import coupons from a CSV file (header required, see CouponService.importCsv)")
    public CouponService.ImportResult importCsv(
            @org.springframework.web.bind.annotation.RequestParam("file")
            org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        try (var reader = new java.io.InputStreamReader(file.getInputStream(),
                java.nio.charset.StandardCharsets.UTF_8)) {
            return couponService.importCsv(reader);
        }
    }
}
