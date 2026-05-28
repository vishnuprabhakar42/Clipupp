package com.clipupp.home.api.dto;

import com.clipupp.home.domain.HomepageSection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class HomepageDtos {

    private HomepageDtos() {}

    public record SectionDetail(
            UUID id,
            String code,
            String title,
            String subtitle,
            boolean enabled,
            int position,
            Integer itemLimit,
            String config,
            OffsetDateTime updatedAt
    ) {
        public static SectionDetail from(HomepageSection s) {
            return new SectionDetail(s.getId(), s.getCode(), s.getTitle(), s.getSubtitle(),
                    s.isEnabled(), s.getPosition(), s.getItemLimit(),
                    s.getConfig() == null ? "{}" : s.getConfig(),
                    s.getUpdatedAt());
        }
    }

    public record SectionUpdate(
            @Size(max = 200) String title,
            @Size(max = 280) String subtitle,
            Boolean enabled,
            @PositiveOrZero Integer itemLimit,
            String config
    ) {}

    public record ReorderRequest(@NotEmpty List<UUID> ids) {}

    public record FeaturedItem(String slug, String title, String imageUrl) {}

    public record FeaturedAssignment(@NotBlank String slug, @PositiveOrZero int position) {}

    public record FeaturedAssignmentRequest(List<FeaturedAssignment> items) {}
}
