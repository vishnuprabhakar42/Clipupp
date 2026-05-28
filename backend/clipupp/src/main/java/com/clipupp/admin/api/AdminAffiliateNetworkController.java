package com.clipupp.admin.api;

import com.clipupp.affiliates.api.dto.AffiliateNetworkDtos;
import com.clipupp.affiliates.application.AffiliateAdminService;
import com.clipupp.affiliates.domain.AffiliateNetwork;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/admin/affiliate-networks",
        produces = MediaType.APPLICATION_JSON_VALUE,
        consumes = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/affiliate-networks", description = "Admin affiliate network CRUD")
public class AdminAffiliateNetworkController {

    private final AffiliateAdminService service;

    public AdminAffiliateNetworkController(AffiliateAdminService service) {
        this.service = service;
    }

    @GetMapping(consumes = MediaType.ALL_VALUE)
    @Operation(summary = "List configured networks")
    public List<AffiliateNetworkDtos.Detail> list() {
        return service.listNetworks().stream().map(AffiliateNetworkDtos.Detail::from).toList();
    }

    @GetMapping(value = "/{id}", consumes = MediaType.ALL_VALUE)
    @Operation(summary = "Get a single network")
    public AffiliateNetworkDtos.Detail get(@PathVariable UUID id) {
        return AffiliateNetworkDtos.Detail.from(service.requireNetwork(id));
    }

    @PostMapping
    @Operation(summary = "Create a network")
    public ResponseEntity<AffiliateNetworkDtos.Detail> create(@RequestBody @Valid AffiliateNetworkDtos.Create input) {
        AffiliateNetwork n = service.createNetwork(input.code(), input.name(),
                input.postbackSecret(), input.active(), input.configJson());
        return ResponseEntity.status(HttpStatus.CREATED).body(AffiliateNetworkDtos.Detail.from(n));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update a network")
    public AffiliateNetworkDtos.Detail update(@PathVariable UUID id,
                                              @RequestBody @Valid AffiliateNetworkDtos.Update input) {
        AffiliateNetwork n = service.updateNetwork(id, input.name(), input.postbackSecret(),
                input.active(), input.configJson());
        return AffiliateNetworkDtos.Detail.from(n);
    }
}
