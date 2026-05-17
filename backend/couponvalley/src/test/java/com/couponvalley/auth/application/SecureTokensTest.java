package com.couponvalley.auth.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class SecureTokensTest {

    @Test
    void generated_tokens_are_unique_and_long_enough() {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 1_000; i++) {
            String t = SecureTokens.generate();
            assertThat(t).hasSizeGreaterThanOrEqualTo(40);
            assertThat(seen.add(t))
                    .as("collision at iteration %d for token %s", i, t)
                    .isTrue();
        }
    }

    @Test
    void hash_is_deterministic_and_32_bytes() {
        byte[] a = SecureTokens.hash("hello-world");
        byte[] b = SecureTokens.hash("hello-world");
        assertThat(a).isEqualTo(b);
        assertThat(a).hasSize(32);
    }

    @Test
    void different_tokens_produce_different_hashes() {
        byte[] a = SecureTokens.hash("token-a");
        byte[] b = SecureTokens.hash("token-b");
        assertThat(a).isNotEqualTo(b);
    }
}
