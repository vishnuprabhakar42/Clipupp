package com.clipupp.admin.api;

import com.clipupp.affiliates.api.dto.MerchantNetworkLinkDtos;
import com.clipupp.affiliates.application.AffiliateAdminService;
import com.clipupp.affiliates.domain.MerchantNetworkLink;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
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
@RequestMapping(path = "/api/v1/admin/merchant-network-links",
        produces = MediaType.APPLICATION_JSON_VALUE,
        consumes = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/merchant-network-links", description = "Per-store deeplink configuration")
public class AdminMerchantNetworkLinkController {

    private final AffiliateAdminService service;

    public AdminMerchantNetworkLinkController(AffiliateAdminService service) {
        this.service = service;
    }

    @GetMapping(consumes = MediaType.ALL_VALUE)
    @Operation(summary = "List links for a store")
    public List<MerchantNetworkLinkDtos.Detail> list(@RequestParam UUID storeId) {
        return service.listLinksForStore(storeId).stream()
                .map(MerchantNetworkLinkDtos.Detail::from).toList();
    }

    @GetMapping(value = "/{id}", consumes = MediaType.ALL_VALUE)
    @Operation(summary = "Get a single merchant-network link")
    public MerchantNetworkLinkDtos.Detail get(@PathVariable UUID id) {
        return MerchantNetworkLinkDtos.Detail.from(service.findLink(id));
    }

    @PostMapping
    @Operation(summary = "Create a merchant→network link")
    public ResponseEntity<MerchantNetworkLinkDtos.Detail> create(
            @RequestBody @Valid MerchantNetworkLinkDtos.Create input) {
        MerchantNetworkLink l = service.createLink(input.storeId(), input.networkId(),
                input.advertiserId(), input.deeplinkTemplate(), input.priority(), input.active());
        return ResponseEntity.status(HttpStatus.CREATED).body(MerchantNetworkLinkDtos.Detail.from(l));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update a merchant→network link")
    public MerchantNetworkLinkDtos.Detail update(@PathVariable UUID id,
                                                 @RequestBody @Valid MerchantNetworkLinkDtos.Update input) {
        MerchantNetworkLink l = service.updateLink(id, input.advertiserId(),
                input.deeplinkTemplate(), input.priority(), input.active());
        return MerchantNetworkLinkDtos.Detail.from(l);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a merchant→network link")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.deleteLink(id);
        return ResponseEntity.noContent().build();
    }
}
