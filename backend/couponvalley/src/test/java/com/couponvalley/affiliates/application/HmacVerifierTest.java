package com.couponvalley.affiliates.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.couponvalley.common.error.ApiException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import org.junit.jupiter.api.Test;

class HmacVerifierTest {

    private final HmacVerifier hmac = new HmacVerifier();

    @Test
    void valid_signature_passes() {
        byte[] body = "{\"hello\":\"world\"}".getBytes(StandardCharsets.UTF_8);
        String secret = "supersecret";
        String sig = HexFormat.of().formatHex(hmac.computeHmac(body, secret));
        assertThatCode(() -> hmac.verify(body, sig, null, secret)).doesNotThrowAnyException();
    }

    @Test
    void tampered_body_fails() {
        byte[] body = "original".getBytes(StandardCharsets.UTF_8);
        String secret = "supersecret";
        String sig = HexFormat.of().formatHex(hmac.computeHmac(body, secret));
        byte[] tampered = "original-tampered".getBytes(StandardCharsets.UTF_8);

        assertThatThrownBy(() -> hmac.verify(tampered, sig, null, secret))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void wrong_secret_fails() {
        byte[] body = "x".getBytes(StandardCharsets.UTF_8);
        String sig = HexFormat.of().formatHex(hmac.computeHmac(body, "right"));
        assertThatThrownBy(() -> hmac.verify(body, sig, null, "wrong"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void missing_signature_fails() {
        assertThatThrownBy(() -> hmac.verify("x".getBytes(), null, null, "s"))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> hmac.verify("x".getBytes(), "  ", null, "s"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void missing_secret_fails() {
        assertThatThrownBy(() -> hmac.verify("x".getBytes(), "abcdef", null, null))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void malformed_hex_signature_fails() {
        assertThatThrownBy(() -> hmac.verify("x".getBytes(), "not-hex!!", null, "secret"))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void timestamp_within_window_passes() {
        byte[] body = "x".getBytes(StandardCharsets.UTF_8);
        String secret = "secret";
        String sig = HexFormat.of().formatHex(hmac.computeHmac(body, secret));
        String fresh = String.valueOf(Instant.now().getEpochSecond());

        assertThatCode(() -> hmac.verify(body, sig, fresh, secret)).doesNotThrowAnyException();
    }

    @Test
    void timestamp_outside_window_fails() {
        byte[] body = "x".getBytes(StandardCharsets.UTF_8);
        String secret = "secret";
        String sig = HexFormat.of().formatHex(hmac.computeHmac(body, secret));
        String stale = String.valueOf(Instant.now().minusSeconds(3600).getEpochSecond());

        assertThatThrownBy(() -> hmac.verify(body, sig, stale, secret))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void milliseconds_timestamp_also_accepted() {
        byte[] body = "x".getBytes(StandardCharsets.UTF_8);
        String secret = "secret";
        String sig = HexFormat.of().formatHex(hmac.computeHmac(body, secret));
        String millis = String.valueOf(Instant.now().toEpochMilli());

        assertThatCode(() -> hmac.verify(body, sig, millis, secret)).doesNotThrowAnyException();
    }

    @Test
    void compute_hmac_is_deterministic_and_32_bytes() {
        byte[] a = hmac.computeHmac("body".getBytes(), "secret");
        byte[] b = hmac.computeHmac("body".getBytes(), "secret");
        assertThat(a).isEqualTo(b).hasSize(32);
    }
}
