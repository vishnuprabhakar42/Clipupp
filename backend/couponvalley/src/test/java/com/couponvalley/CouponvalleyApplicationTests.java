package com.couponvalley;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Sprint 0 placeholder. The original {@code @SpringBootTest contextLoads()}
 * test required a live Postgres which isn't available in the CI/local default
 * path. Sprint 1 replaces this with proper {@code @WebMvcTest} slice tests for
 * each auth endpoint plus Testcontainers-backed integration tests.
 */
class CouponvalleyApplicationTests {

    @Test
    void mainClassIsAnnotatedSpringBootApplication() {
        assertThat(CouponvalleyApplication.class
                .isAnnotationPresent(org.springframework.boot.autoconfigure.SpringBootApplication.class))
                .isTrue();
    }
}
