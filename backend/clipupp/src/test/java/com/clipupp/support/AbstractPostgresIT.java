package com.clipupp.support;

import org.junit.jupiter.api.Tag;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Base for repository and migration tests that need a real Postgres.
 *
 * One container is started per JVM (singleton pattern) and shared by every
 * subclass, so the Flyway history V001..latest is applied to a fresh database
 * exactly once per test run. Requires a running Docker daemon; such tests carry
 * the "docker" tag so they can be excluded where Docker is unavailable
 * (for example {@code ./gradlew test -PexcludeTags=docker}).
 */
@Tag("docker")
public abstract class AbstractPostgresIT {

    protected static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:16-alpine")
                    .withDatabaseName("clipupp_it")
                    .withUsername("clipupp")
                    .withPassword("clipupp");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
    }
}
