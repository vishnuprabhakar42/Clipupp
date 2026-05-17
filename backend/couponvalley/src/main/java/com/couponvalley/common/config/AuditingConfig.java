package com.couponvalley.common.config;

import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;

/**
 * Configures Spring Data JPA auditing to use {@link OffsetDateTime} for
 * {@code @CreatedDate} and {@code @LastModifiedDate} fields.
 */
@Configuration
public class AuditingConfig {

    /**
     * Provides the current date/time as {@link OffsetDateTime} for JPA auditing.
     * This ensures that audit timestamp fields are populated with zone-aware
     * timestamps in UTC.
     */
    @Bean
    public DateTimeProvider dateTimeProvider() {
        return () -> Optional.of(OffsetDateTime.now());
    }
}

