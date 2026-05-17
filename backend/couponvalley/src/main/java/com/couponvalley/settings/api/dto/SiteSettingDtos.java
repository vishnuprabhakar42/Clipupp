package com.couponvalley.settings.api.dto;

import com.couponvalley.settings.domain.SiteSetting;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.Map;

public final class SiteSettingDtos {

    private SiteSettingDtos() {}

    public record Detail(String key, Object value, OffsetDateTime updatedAt) {
        public static Detail from(SiteSetting s) {
            // Hibernate stores the JSONB column as the raw JSON text — let the
            // Jackson serialiser embed it as already-parsed JSON below.
            return new Detail(s.getKey(), Json.parse(s.getValue()), s.getUpdatedAt());
        }
    }

    /** Single-key update body. The JSONB column accepts any JSON value. */
    public record Update(@NotNull Object value) {}

    /** Bulk write — { key: jsonValue, ... }. */
    public record BulkUpdate(@NotEmpty Map<String, Object> values) {}
}
