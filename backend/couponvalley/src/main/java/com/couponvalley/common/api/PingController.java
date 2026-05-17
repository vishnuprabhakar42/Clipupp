package com.couponvalley.common.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Sprint 0 smoke endpoint. Confirms security, error handling, request-id, and
 * OpenAPI plumbing all wire up. Replace or remove once real endpoints exist.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "platform", description = "Platform smoke endpoints")
public class PingController {

    @GetMapping("/ping")
    @Operation(summary = "Liveness ping", description = "Returns service name + timestamp; no auth required.")
    public Map<String, Object> ping() {
        return Map.of(
                "service", "couponvalley",
                "version", "v1",
                "timestamp", Instant.now().toString());
    }
}
