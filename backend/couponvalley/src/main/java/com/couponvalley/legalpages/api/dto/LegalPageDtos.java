package com.couponvalley.legalpages.api.dto;

import com.couponvalley.legalpages.domain.LegalPage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public final class LegalPageDtos {

    private LegalPageDtos() {}

    public record Detail(
            String slug,
            String title,
            String bodyMd,
            String metaTitle,
            String metaDescription,
            OffsetDateTime updatedAt
    ) {
        public static Detail from(LegalPage p) {
            return new Detail(p.getSlug(), p.getTitle(), p.getBodyMd(),
                    p.getMetaTitle(), p.getMetaDescription(), p.getUpdatedAt());
        }
    }

    public record Summary(String slug, String title, OffsetDateTime updatedAt) {
        public static Summary from(LegalPage p) {
            return new Summary(p.getSlug(), p.getTitle(), p.getUpdatedAt());
        }
    }

    /** Admins edit body + meta + title only. Slug is fixed (routes are hardcoded). */
    public record Update(
            @NotBlank @Size(max = 200) String title,
            @NotBlank String bodyMd,
            @Size(max = 70) String metaTitle,
            @Size(max = 200) String metaDescription
    ) {}
}
