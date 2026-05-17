package com.couponvalley.affiliates.application;

import com.couponvalley.common.error.ApiException;
import com.couponvalley.common.error.ErrorCode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Shared HMAC-SHA256 verifier. Adapters call {@link #verify} with the raw
 * request body, the signature header value, and the network secret. We
 * always compare in constant time and clamp the timestamp window so replays
 * fail fast.
 */
@Component
public class HmacVerifier {

    private static final Duration MAX_AGE = Duration.ofMinutes(5);

    /**
     * Verify a hex-encoded HMAC-SHA256 signature over {@code body}. Optionally
     * also verifies a unix-epoch-seconds timestamp falls within ±5 minutes of
     * "now" — pass {@code null} for {@code timestampHeader} to skip.
     */
    public void verify(byte[] body, String signatureHex, String timestampHeader, String secret) {
        if (signatureHex == null || signatureHex.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "Missing signature");
        }
        if (secret == null || secret.isEmpty()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "Network secret not configured");
        }
        if (timestampHeader != null) {
            requireFreshTimestamp(timestampHeader);
        }

        byte[] expected = computeHmac(body, secret);
        byte[] actual;
        try {
            actual = HexFormat.of().parseHex(signatureHex.trim().toLowerCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "Malformed signature");
        }
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "Signature mismatch");
        }
    }

    public byte[] computeHmac(byte[] body, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(body);
        } catch (Exception ex) {
            throw new IllegalStateException("HmacSHA256 unavailable", ex);
        }
    }

    private static void requireFreshTimestamp(String value) {
        long ts;
        try {
            ts = Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "Invalid timestamp");
        }
        Instant t = ts > 99_999_999_999L ? Instant.ofEpochMilli(ts) : Instant.ofEpochSecond(ts);
        Instant now = Instant.now();
        if (Duration.between(t, now).abs().compareTo(MAX_AGE) > 0) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, "Timestamp outside acceptable window");
        }
    }
}
