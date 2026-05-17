package com.couponvalley.auth.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Cryptographically-strong opaque tokens. Used for refresh tokens, email
 * verification, password reset, and newsletter confirmation. We never store
 * the plaintext — only its SHA-256 hash. The plaintext lives only in the
 * cookie / URL during its narrow window of use.
 */
public final class SecureTokens {
    private SecureTokens() {}

    private static final SecureRandom RNG = new SecureRandom();
    private static final Base64.Encoder URLSAFE = Base64.getUrlEncoder().withoutPadding();

    /** 256 bits of randomness, base64url-encoded (~43 chars). */
    public static String generate() {
        byte[] buf = new byte[32];
        RNG.nextBytes(buf);
        return URLSAFE.encodeToString(buf);
    }

    /** SHA-256 hash of the UTF-8 bytes. Used as the DB lookup key. */
    public static byte[] hash(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest(token.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable", ex);
        }
    }
}
