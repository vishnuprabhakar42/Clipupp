package com.couponvalley.newsletter.api;

import com.couponvalley.newsletter.api.dto.NewsletterDtos;
import com.couponvalley.newsletter.application.NewsletterService;
import com.couponvalley.newsletter.domain.NewsletterSource;
import com.couponvalley.newsletter.domain.NewsletterSubscription;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/newsletter", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "newsletter", description = "Public newsletter subscribe / confirm / unsubscribe")
@SecurityRequirements
public class PublicNewsletterController {

    private final NewsletterService newsletter;

    public PublicNewsletterController(NewsletterService newsletter) {
        this.newsletter = newsletter;
    }

    @PostMapping(path = "/subscribe", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Submit an email for double-opt-in subscription",
            description = "Always returns 202 — never reveals whether the email already exists.")
    public ResponseEntity<NewsletterDtos.SubscribeResponse> subscribe(
            @RequestBody @Valid NewsletterDtos.SubscribeRequest req) {
        NewsletterService.SubscribeResult result = newsletter.subscribe(
                req.email(), req.locale(), NewsletterSource.WEB);
        return ResponseEntity.accepted().body(NewsletterDtos.SubscribeResponse.from(result));
    }

    @GetMapping("/confirm")
    @Operation(summary = "Confirm a newsletter subscription via emailed token")
    public NewsletterDtos.StateResponse confirm(@RequestParam("token") String token) {
        NewsletterSubscription sub = newsletter.confirm(token);
        return new NewsletterDtos.StateResponse(sub.getStatus(), sub.getEmail());
    }

    @GetMapping("/unsubscribe")
    @Operation(summary = "Single-click unsubscribe via emailed token")
    public NewsletterDtos.StateResponse unsubscribe(@RequestParam("token") String token) {
        NewsletterSubscription sub = newsletter.unsubscribe(token);
        return new NewsletterDtos.StateResponse(sub.getStatus(), sub.getEmail());
    }
}
