package com.couponvalley.admin.api;

import com.couponvalley.stores.api.dto.StoreAdminDetail;
import com.couponvalley.stores.api.dto.StoreDetailResponse;
import com.couponvalley.stores.api.dto.StoreInput;
import com.couponvalley.stores.api.dto.StoreSummary;
import com.couponvalley.stores.application.StoreService;
import com.couponvalley.stores.application.StoreService.BulkAction;
import com.couponvalley.stores.application.StoreService.BulkResult;
import com.couponvalley.stores.domain.Store;
import com.couponvalley.stores.domain.StoreStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
@RequestMapping(path = "/api/v1/admin/stores", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/stores", description = "Admin store CRUD")
public class AdminStoresController {

    private final StoreService storeService;

    public AdminStoresController(StoreService storeService) {
        this.storeService = storeService;
    }

    @GetMapping
    @Operation(summary = "List stores (admin) with optional search and filters")
    public Page<StoreSummary> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) StoreStatus status,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        int safeSize = Math.max(1, Math.min(size, 200));
        var result = storeService.listForAdmin(q, country, status, featured,
                PageRequest.of(Math.max(0, page), safeSize, Sort.unsorted()));
        return result.map(StoreSummary::from);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Fetch a store for editing")
    public StoreAdminDetail get(@PathVariable UUID id) {
        Store s = storeService.findForAdmin(id);
        return StoreAdminDetail.from(s, storeService.topOffers(id));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Create a new store")
    public ResponseEntity<StoreSummary> create(@RequestBody @Valid StoreInput.Create input) {
        Store saved = storeService.createStore(input.toCommand());
        storeService.refreshStats(saved.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(StoreSummary.from(saved));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Update fields on an existing store")
    public StoreSummary update(@PathVariable UUID id, @RequestBody @Valid StoreInput.Update input) {
        Store updated = storeService.updateStore(id, input.toCommand());
        return StoreSummary.from(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a store")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        storeService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore a soft-deleted store")
    public ResponseEntity<Void> restore(@PathVariable UUID id) {
        storeService.restore(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/refresh-stats")
    @Operation(summary = "Recompute Stats for a store")
    public ResponseEntity<StoreDetailResponse.StatsResponse> refreshStats(@PathVariable UUID id) {
        var stats = storeService.refreshStats(id);
        return ResponseEntity.ok(StoreDetailResponse.StatsResponse.from(stats));
    }

    public record BulkRequest(@NotNull BulkAction action, @NotEmpty List<UUID> ids) {}

    @PostMapping(value = "/bulk", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Bulk action on a set of stores")
    public BulkResult bulk(@RequestBody @Valid BulkRequest req) {
        return storeService.bulk(req.action(), req.ids());
    }
}
