package com.couponvalley.admin.api;

import com.couponvalley.campaigns.api.dto.CampaignDtos;
import com.couponvalley.campaigns.application.CampaignService;
import com.couponvalley.campaigns.domain.Campaign;
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
@RequestMapping(path = "/api/v1/admin/campaigns", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/campaigns", description = "Campaign CRUD")
public class AdminCampaignsController {

    private final CampaignService service;

    public AdminCampaignsController(CampaignService service) {
        this.service = service;
    }

    @GetMapping
    public List<CampaignDtos.Summary> list() {
        return service.listAll().stream().map(CampaignDtos.Summary::from).toList();
    }

    @GetMapping("/{id}")
    public CampaignDtos.Detail get(@PathVariable UUID id) {
        return CampaignDtos.Detail.from(service.findById(id));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Create a campaign")
    public ResponseEntity<CampaignDtos.Detail> create(@RequestBody @Valid CampaignDtos.Create input) {
        Campaign c = service.create(input);
        return ResponseEntity.status(HttpStatus.CREATED).body(CampaignDtos.Detail.from(c));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public CampaignDtos.Detail update(@PathVariable UUID id,
                                      @RequestBody @Valid CampaignDtos.Update input) {
        return CampaignDtos.Detail.from(service.update(id, input));
    }

    @PostMapping("/{id}/activate")
    @Operation(summary = "Mark a campaign as active (date window still applies)")
    public CampaignDtos.Detail activate(@PathVariable UUID id) {
        return CampaignDtos.Detail.from(service.activate(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
