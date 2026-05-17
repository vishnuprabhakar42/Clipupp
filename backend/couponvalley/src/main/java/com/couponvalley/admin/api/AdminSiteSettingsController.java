package com.couponvalley.admin.api;

import com.couponvalley.settings.api.dto.SiteSettingDtos;
import com.couponvalley.settings.application.SiteSettingService;
import com.couponvalley.settings.domain.SiteSetting;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/admin/settings", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/settings", description = "Site settings CMS")
public class AdminSiteSettingsController {

    private final SiteSettingService service;

    public AdminSiteSettingsController(SiteSettingService service) {
        this.service = service;
    }

    @GetMapping
    public List<SiteSettingDtos.Detail> list() {
        return service.listAll().stream().map(SiteSettingDtos.Detail::from).toList();
    }

    @PatchMapping(value = "/{key:.+}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Set a single setting (creates if missing)")
    public SiteSettingDtos.Detail update(@PathVariable String key,
                                         @RequestBody @Valid SiteSettingDtos.Update body) {
        SiteSetting saved = service.upsert(key, body.value());
        return SiteSettingDtos.Detail.from(saved);
    }

    @PostMapping(value = "/bulk", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Set many settings at once. Body shape: { values: { key: jsonValue, ... } }")
    public List<SiteSettingDtos.Detail> bulk(@RequestBody @Valid SiteSettingDtos.BulkUpdate body) {
        Map<String, Object> values = body.values();
        return service.upsertAll(values).stream()
                .map(SiteSettingDtos.Detail::from)
                .toList();
    }
}
