package com.clipupp.support;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Base for repository and migration tests that need a real Postgres.
 *
 * One container is started lazily per JVM (singleton pattern) and shared by
 * every subclass, so the Flyway history V001..latest is applied to a fresh
 * database exactly once per test run. Needs a Docker daemon: when none is
 * reachable, {@link #requireDocker()} aborts the class via a JUnit assumption,
 * so the tests are reported as skipped instead of failing the build. Such
 * tests also carry the "docker" tag.
 */
@Tag("docker")
public abstract class AbstractPostgresIT {

    protected static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:16-alpine")
                    .withDatabaseName("clipupp_it")
                    .withUsername("clipupp")
                    .withPassword("clipupp");

    @BeforeAll
    static void requireDocker() {
        Assumptions.assumeTrue(
                DockerClientFactory.instance().isDockerAvailable(),
                "Docker not available; skipping Postgres integration tests");
        startPostgres();
    }

    private static synchronized void startPostgres() {
        if (!POSTGRES.isRunning()) {
            POSTGRES.start();
        }
    }

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
    }
}
