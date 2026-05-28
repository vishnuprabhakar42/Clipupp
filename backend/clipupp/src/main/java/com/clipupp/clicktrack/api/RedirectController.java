package com.clipupp.clicktrack.api;

import com.clipupp.clicktrack.application.ClickService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "redirect", description = "Outbound clickout endpoint")
@SecurityRequirements
public class RedirectController {

    private final ClickService clickService;

    public RedirectController(ClickService clickService) {
        this.clickService = clickService;
    }

    @GetMapping("/r/{couponId}")
    @Operation(
            summary = "Click out to the merchant",
            description = "Records the click and 302-redirects to the affiliate deeplink. " +
                    "If the user is signed in, the click is attributed to them. " +
                    "Requests with no active affiliate link still 302 — to the merchant's primary URL.")
    public ResponseEntity<Void> redirect(@PathVariable UUID couponId,
                                          HttpServletRequest request,
                                          Authentication auth) {
        UUID userId = parseUserId(auth);
        ClickService.ClickResult result = clickService.recordClick(couponId, userId, request);

        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(result.outboundUrl()));
        headers.setCacheControl("no-store");
        headers.set("X-CV-Click-Id", result.clickId().toString());
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    private static UUID parseUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) return null;
        try { return UUID.fromString(auth.getName()); }
        catch (IllegalArgumentException ex) { return null; }
    }
}
