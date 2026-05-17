package com.couponvalley.campaigns.api;

import com.couponvalley.campaigns.api.dto.CampaignDtos;
import com.couponvalley.campaigns.application.CampaignService;
import com.couponvalley.campaigns.domain.Campaign;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/campaigns", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "campaigns", description = "Public campaigns")
public class PublicCampaignsController {

    private final CampaignService service;

    public PublicCampaignsController(CampaignService service) {
        this.service = service;
    }

    @GetMapping("/active")
    public ResponseEntity<CampaignDtos.Detail> active() {
        Campaign c = service.findActive();
        if (c == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(CampaignDtos.Detail.from(c));
    }
}
