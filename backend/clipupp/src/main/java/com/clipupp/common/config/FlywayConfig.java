package com.clipupp.common.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import javax.sql.DataSource;

/**
 * Explicit Flyway configuration to ensure migrations run before Hibernate validation.
 *
 * Auto-repair on dev: when we tweak the seed text inside a previously-applied
 * migration (e.g. a brand rename) the file's checksum changes and Flyway aborts
 * with a "checksum mismatch" validation error. In dev that's a footgun we want
 * the framework to recover from automatically; in prod migrations must stay
 * byte-immutable, so repair is gated.
 *
 * Production override (rare): set the env var FLYWAY_REPAIR=true to force a
 * repair() at startup once, e.g. after an intentional rebrand sweep.
 */
@Configuration
@ConditionalOnProperty(name = "spring.flyway.enabled", havingValue = "true", matchIfMissing = true)
public class FlywayConfig {

    @Bean
    public Flyway flyway(DataSource dataSource, Environment env) {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load();

        boolean repair = env.acceptsProfiles(Profiles.of("dev"))
                || "true".equalsIgnoreCase(env.getProperty("FLYWAY_REPAIR"));
        if (repair) {
            // Realigns flyway_schema_history checksums with current file
            // contents. Does NOT re-run migrations or modify table data.
            flyway.repair();
        }

        flyway.migrate();
        return flyway;
    }
}
