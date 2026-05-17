package com.couponvalley.admin.api;

import com.couponvalley.home.api.dto.HomepageDtos;
import com.couponvalley.home.application.HomepageService;
import com.couponvalley.home.application.HomepageService.FeaturedType;
import com.couponvalley.home.domain.HomepageSection;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
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
@RequestMapping(path = "/api/v1/admin/homepage", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/homepage", description = "Homepage layout CMS")
public class AdminHomepageController {

    private final HomepageService service;

    public AdminHomepageController(HomepageService service) {
        this.service = service;
    }

    @GetMapping("/sections")
    public List<HomepageDtos.SectionDetail> listSections() {
        return service.listAllOrdered().stream().map(HomepageDtos.SectionDetail::from).toList();
    }

    @PatchMapping(value = "/sections/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Update title/subtitle/enabled/itemLimit/config of a section")
    public HomepageDtos.SectionDetail updateSection(@PathVariable UUID id,
                                                    @RequestBody @Valid HomepageDtos.SectionUpdate input) {
        HomepageSection s = service.updateSection(id, input);
        return HomepageDtos.SectionDetail.from(s);
    }

    @PostMapping(value = "/sections/reorder", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Set the section order via a list of section ids")
    public ResponseEntity<Void> reorder(@RequestBody @Valid HomepageDtos.ReorderRequest req) {
        service.reorder(req.ids());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/featured/{type}")
    public List<HomepageDtos.FeaturedItem> listFeatured(@PathVariable FeaturedType type) {
        return switch (type) {
            case stores -> service.featuredStores().stream()
                    .map(s -> new HomepageDtos.FeaturedItem(s.getSlug(), s.getName(), s.getLogoUrl()))
                    .toList();
            case coupons -> service.featuredCoupons().stream()
                    .map(c -> new HomepageDtos.FeaturedItem(c.getSlug(), c.getTitle(), null))
                    .toList();
            case categories -> service.featuredCategories().stream()
                    .map(c -> new HomepageDtos.FeaturedItem(c.getSlug(), c.getTitle(), null))
                    .toList();
        };
    }

    @PostMapping(value = "/featured/{type}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Replace the featured set for the given type")
    public ResponseEntity<Void> setFeatured(@PathVariable FeaturedType type,
                                            @RequestBody @Valid HomepageDtos.FeaturedAssignmentRequest req) {
        service.setFeatured(type, req.items());
        return ResponseEntity.noContent().build();
    }

}
