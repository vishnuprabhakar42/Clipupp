package com.couponvalley.auth.infra;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.couponvalley.auth.domain.Role;
import com.couponvalley.common.config.JwtProperties;
import io.jsonwebtoken.JwtException;
import java.util.EnumSet;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JwtIssuerTest {

    private static final String SECRET =
            "test-only-secret-not-for-prod-32bytes-min-please-do-not-reuse";

    private final JwtProperties props =
            new JwtProperties("couponvalley-test", "cv-test", SECRET, 900L, 2_592_000L);
    private final JwtIssuer issuer = new JwtIssuer(props);

    @Test
    void issue_then_verify_round_trips() {
        UUID userId = UUID.randomUUID();
        String token = issuer.issueAccessToken(userId, EnumSet.of(Role.USER, Role.ADMIN), "hi");

        JwtIssuer.ParsedJwt parsed = issuer.verify(token);

        assertThat(parsed.userId()).isEqualTo(userId);
        assertThat(parsed.locale()).isEqualTo("hi");
        assertThat(parsed.roles()).containsExactlyInAnyOrder("USER", "ADMIN");
        assertThat(parsed.expiresAt()).isAfter(java.time.Instant.now());
    }

    @Test
    void rejects_token_signed_with_wrong_key() {
        JwtProperties otherProps = new JwtProperties("couponvalley-test", "cv-test",
                "different-secret-32-bytes-yes-this-is-long-enough-yepyep", 900L, 2_592_000L);
        JwtIssuer otherIssuer = new JwtIssuer(otherProps);
        String forged = otherIssuer.issueAccessToken(UUID.randomUUID(), EnumSet.of(Role.USER), "en");

        assertThatThrownBy(() -> issuer.verify(forged)).isInstanceOf(JwtException.class);
    }

    @Test
    void rejects_token_with_wrong_issuer() {
        JwtProperties otherProps = new JwtProperties("imposter", "cv-test", SECRET, 900L, 2_592_000L);
        JwtIssuer otherIssuer = new JwtIssuer(otherProps);
        String foreign = otherIssuer.issueAccessToken(UUID.randomUUID(), EnumSet.of(Role.USER), "en");

        assertThatThrownBy(() -> issuer.verify(foreign)).isInstanceOf(JwtException.class);
    }

    @Test
    void rejects_garbage_token() {
        assertThatThrownBy(() -> issuer.verify("not.a.jwt")).isInstanceOf(JwtException.class);
    }

    @Test
    void rejects_too_short_secret_at_construction() {
        JwtProperties weak = new JwtProperties("issuer", "audience", "tiny", 60L, 60L);
        assertThatThrownBy(() -> new JwtIssuer(weak))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 bytes");
    }
}
