package com.clipupp.settings.api;

import com.clipupp.settings.application.SiteSettingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only public access to allowlisted site settings. The frontend uses
 * this to render footer copy, social links, newsletter strings, default SEO
 * meta, etc. without round-tripping through the admin endpoint.
 */
@RestController
@RequestMapping(path = "/api/v1/settings", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "settings", description = "Public site settings")
public class PublicSiteSettingsController {

    private final SiteSettingService service;

    public PublicSiteSettingsController(SiteSettingService service) {
        this.service = service;
    }

    @GetMapping("/public")
    public Map<String, Object> publicMap() {
        return service.publicMap();
    }
}
