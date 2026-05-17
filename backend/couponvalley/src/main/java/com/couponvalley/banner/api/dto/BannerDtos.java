package com.couponvalley.banner.api.dto;

import com.couponvalley.banner.domain.Banner;
import com.couponvalley.banner.domain.BannerPlacement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class BannerDtos {

    private BannerDtos() {}

    public record Detail(UUID id, short position, String title, String subtitle,
                         String imageUrl, String linkUrl,
                         OffsetDateTime startsAt, OffsetDateTime endsAt,
                         boolean active, String countryCode,
                         BannerPlacement placement) {
        public static Detail from(Banner b) {
            return new Detail(b.getId(), b.getPosition(), b.getTitle(), b.getSubtitle(),
                    b.getImageUrl(), b.getLinkUrl(), b.getStartsAt(), b.getEndsAt(),
                    b.isActive(), b.getCountryCode(), b.getPlacement());
        }
    }

    public record Create(@NotBlank @Size(max = 200) String title,
                         @Size(max = 280) String subtitle,
                         @NotBlank @Size(max = 500) String imageUrl,
                         @NotBlank @Size(max = 500) String linkUrl,
                         Short position,
                         OffsetDateTime startsAt,
                         OffsetDateTime endsAt,
                         Boolean active,
                         @Pattern(regexp = "^[A-Z]{2}$") String countryCode,
                         BannerPlacement placement) {}

    public record Update(@Size(max = 200) String title,
                         @Size(max = 280) String subtitle,
                         @Size(max = 500) String imageUrl,
                         @Size(max = 500) String linkUrl,
                         Short position,
                         OffsetDateTime startsAt,
                         OffsetDateTime endsAt,
                         Boolean active,
                         @Pattern(regexp = "^[A-Z]{2}$") String countryCode,
                         BannerPlacement placement) {}
}
