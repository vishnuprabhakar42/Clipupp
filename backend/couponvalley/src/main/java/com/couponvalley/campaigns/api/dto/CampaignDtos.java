package com.couponvalley.campaigns.api.dto;

import com.couponvalley.campaigns.domain.Campaign;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class CampaignDtos {

    private CampaignDtos() {}

    public record Detail(
            UUID id,
            String slug,
            String name,
            String description,
            OffsetDateTime startsAt,
            OffsetDateTime endsAt,
            boolean active,
            String heroTitle,
            String heroSubtitle,
            String heroImageUrl,
            String ctaLabel,
            String ctaUrl,
            String themeColor,
            UUID bannerId,
            List<UUID> pinnedStoreIds,
            List<UUID> pinnedCouponIds,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {
        public static Detail from(Campaign c) {
            return new Detail(c.getId(), c.getSlug(), c.getName(), c.getDescription(),
                    c.getStartsAt(), c.getEndsAt(), c.isActive(),
                    c.getHeroTitle(), c.getHeroSubtitle(), c.getHeroImageUrl(),
                    c.getCtaLabel(), c.getCtaUrl(), c.getThemeColor(), c.getBannerId(),
                    c.getPinnedStoreIds() == null ? List.of() : List.of(c.getPinnedStoreIds()),
                    c.getPinnedCouponIds() == null ? List.of() : List.of(c.getPinnedCouponIds()),
                    c.getCreatedAt(), c.getUpdatedAt());
        }
    }

    public record Summary(UUID id, String slug, String name,
                          OffsetDateTime startsAt, OffsetDateTime endsAt,
                          boolean active) {
        public static Summary from(Campaign c) {
            return new Summary(c.getId(), c.getSlug(), c.getName(),
                    c.getStartsAt(), c.getEndsAt(), c.isActive());
        }
    }

    public record Create(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 180) String slug,
            String description,
            @NotNull OffsetDateTime startsAt,
            @NotNull OffsetDateTime endsAt,
            Boolean active,
            @Size(max = 200) String heroTitle,
            @Size(max = 280) String heroSubtitle,
            @Size(max = 500) String heroImageUrl,
            @Size(max = 60) String ctaLabel,
            @Size(max = 500) String ctaUrl,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "hex color #RRGGBB") String themeColor,
            UUID bannerId,
            List<UUID> pinnedStoreIds,
            List<UUID> pinnedCouponIds
    ) {}

    public record Update(
            @Size(max = 200) String name,
            @Size(max = 180) String slug,
            String description,
            OffsetDateTime startsAt,
            OffsetDateTime endsAt,
            Boolean active,
            @Size(max = 200) String heroTitle,
            @Size(max = 280) String heroSubtitle,
            @Size(max = 500) String heroImageUrl,
            @Size(max = 60) String ctaLabel,
            @Size(max = 500) String ctaUrl,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "hex color #RRGGBB") String themeColor,
            UUID bannerId,
            List<UUID> pinnedStoreIds,
            List<UUID> pinnedCouponIds
    ) {}
}
