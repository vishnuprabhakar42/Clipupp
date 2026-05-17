package com.couponvalley.banner.api;

import com.couponvalley.banner.application.BannerService;
import com.couponvalley.banner.api.dto.BannerDtos;
import com.couponvalley.banner.domain.BannerPlacement;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/banners", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "banners", description = "Homepage banner carousel")
@SecurityRequirements
public class PublicBannersController {

    private final BannerService bannerService;

    public PublicBannersController(BannerService bannerService) {
        this.bannerService = bannerService;
    }

    @GetMapping
    @Operation(summary = "Currently-live banners (filterable by country and placement)")
    public ResponseEntity<List<BannerDtos.Detail>> list(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) BannerPlacement placement) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic()
                        .staleWhileRevalidate(Duration.ofMinutes(30)))
                .body(bannerService.live(country, placement).stream().map(BannerDtos.Detail::from).toList());
    }
}
