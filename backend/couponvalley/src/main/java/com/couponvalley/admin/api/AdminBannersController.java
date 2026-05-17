package com.couponvalley.admin.api;

import com.couponvalley.banner.api.dto.BannerDtos;
import com.couponvalley.banner.application.BannerService;
import com.couponvalley.banner.domain.Banner;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/admin/banners", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/banners", description = "Homepage banner CMS")
public class AdminBannersController {

    private final BannerService service;

    public AdminBannersController(BannerService service) {
        this.service = service;
    }

    @GetMapping(consumes = MediaType.ALL_VALUE)
    public List<BannerDtos.Detail> list() {
        return service.adminList().stream().map(BannerDtos.Detail::from).toList();
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Create a banner")
    public ResponseEntity<BannerDtos.Detail> create(@RequestBody @Valid BannerDtos.Create input) {
        Banner b = service.create(input.title(), input.subtitle(), input.imageUrl(), input.linkUrl(),
                input.position(), input.startsAt(), input.endsAt(), input.active(), input.countryCode(),
                input.placement());
        return ResponseEntity.status(HttpStatus.CREATED).body(BannerDtos.Detail.from(b));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public BannerDtos.Detail update(@PathVariable UUID id, @RequestBody @Valid BannerDtos.Update input) {
        Banner b = service.update(id, input.title(), input.subtitle(), input.imageUrl(), input.linkUrl(),
                input.position(), input.startsAt(), input.endsAt(), input.active(), input.countryCode(),
                input.placement());
        return BannerDtos.Detail.from(b);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record ReorderRequest(List<UUID> ids) {}

    @PostMapping(value = "/reorder", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Bulk re-order banners by id list (0..N-1 positions)")
    public ResponseEntity<Void> reorder(@RequestBody ReorderRequest body) {
        service.reorder(body.ids() == null ? List.of() : body.ids());
        return ResponseEntity.noContent().build();
    }
}
