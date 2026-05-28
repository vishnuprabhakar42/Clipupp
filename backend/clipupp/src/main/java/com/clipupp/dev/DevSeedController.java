package com.clipupp.dev;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dev-only endpoint to seed or clear the database.
 * Loaded only when spring.profiles.active includes "dev".
 */
@RestController
@RequestMapping("/api/v1/dev")
@Profile("dev")
@Tag(name = "dev", description = "Development-only utilities — not available in production")
public class DevSeedController {

    private final DevSeedService seedService;
    private final DevAnalyticsSeederService analyticsSeeder;

    public DevSeedController(DevSeedService seedService,
                             DevAnalyticsSeederService analyticsSeeder) {
        this.seedService = seedService;
        this.analyticsSeeder = analyticsSeeder;
    }

    @PostMapping("/seed")
    @Operation(summary = "Seed the database",
            description = "Idempotent — skips if stores already exist. Creates categories, 15 stores, coupons, blog articles, banners, and 3 users (admin / editor / user).")
    public ResponseEntity<DevSeedService.SeedResult> seed() {
        return ResponseEntity.ok(seedService.seed());
    }

    @DeleteMapping("/seed")
    @Operation(summary = "Wipe all seeded data",
            description = "TRUNCATEs all application tables. Irreversible in current session — use only in development.")
    public ResponseEntity<Void> unseed() {
        seedService.unseed();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/seed-analytics")
    @Operation(summary = "Bulk-seed analytics tables (users, clicks, conversions)",
            description = "Generates thousands of synthetic rows across app_user, click, and conversion " +
                    "so the admin dashboard has data to render. Idempotent — wipes prior synthetic rows " +
                    "(users with `dev+*@clipupp.local` emails) before re-seeding. Refreshes the " +
                    "analytics materialised views on completion. Requires that the regular /seed endpoint " +
                    "has run first (stores, coupons, and networks must exist).")
    public ResponseEntity<DevAnalyticsSeederService.SeedSummary> seedAnalytics(
            @RequestParam(defaultValue = "3000") int users,
            @RequestParam(defaultValue = "80000") int clicks,
            @RequestParam(defaultValue = "3500") int conversions,
            @RequestParam(defaultValue = "90") int days) {
        return ResponseEntity.ok(
                analyticsSeeder.seed(users, clicks, conversions, days));
    }
}
