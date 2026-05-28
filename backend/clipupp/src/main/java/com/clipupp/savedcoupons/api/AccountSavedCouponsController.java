package com.clipupp.savedcoupons.api;

import com.clipupp.common.error.ApiException;
import com.clipupp.common.pagination.CursorPage;
import com.clipupp.savedcoupons.application.SavedCouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/account/saved-coupons", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "account/saved-coupons", description = "Authenticated user saved coupons")
public class AccountSavedCouponsController {

    private final SavedCouponService service;

    public AccountSavedCouponsController(SavedCouponService service) {
        this.service = service;
    }

    public record SaveRequest(@NotNull UUID couponId) {}

    @GetMapping
    @Operation(summary = "List saved coupons for the current user")
    public CursorPage<SavedCouponService.SavedItem> list(
            Authentication auth,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit) {
        return service.list(currentUserId(auth), cursor, limit);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Save a coupon (idempotent)")
    public ResponseEntity<Void> save(Authentication auth, @RequestBody @Valid SaveRequest req) {
        boolean created = service.save(currentUserId(auth), req.couponId());
        return ResponseEntity.status(created ? HttpStatus.CREATED : HttpStatus.OK).build();
    }

    @DeleteMapping("/{couponId}")
    @Operation(summary = "Remove a coupon from the saved list")
    public ResponseEntity<Void> unsave(Authentication auth, @PathVariable UUID couponId) {
        service.unsave(currentUserId(auth), couponId);
        return ResponseEntity.noContent().build();
    }

    private static UUID currentUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw ApiException.unauthorized("Not authenticated");
        }
        try { return UUID.fromString(auth.getName()); }
        catch (IllegalArgumentException ex) { throw ApiException.unauthorized("Invalid session"); }
    }
}
