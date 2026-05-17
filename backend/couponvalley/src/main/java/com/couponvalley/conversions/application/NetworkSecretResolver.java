package com.couponvalley.conversions.application;

import com.couponvalley.affiliates.domain.AffiliateNetwork;
import com.couponvalley.common.error.ApiException;
import com.couponvalley.common.error.ErrorCode;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Resolves an affiliate network's HMAC shared secret.
 *
 * <p>Phase 1 stores secrets on the network row as plain bytes (the column is
 * named {@code postback_secret_enc} with pgcrypto in mind, but we keep that
 * encryption for Phase 2 when the secrets management story matures). Until
 * then, an admin who can read the table can already see the secrets — same
 * threat model as today's environment-variable secrets.
 *
 * <p>For dev parity, an env var override
 * ({@code COUPONVALLEY_NETWORK_SECRET_<CODE>}) lets you point at a sandbox
 * secret without writing to the DB.
 */
@Component
public class NetworkSecretResolver {

    private final boolean envOverrideEnabled;

    public NetworkSecretResolver(@Value("${couponvalley.affiliates.env-secret-override:true}")
                                 boolean envOverrideEnabled) {
        this.envOverrideEnabled = envOverrideEnabled;
    }

    public String requireSecret(AffiliateNetwork network) {
        if (envOverrideEnabled) {
            String env = System.getenv("COUPONVALLEY_NETWORK_SECRET_"
                    + network.getCode().toUpperCase());
            if (env != null && !env.isBlank()) return env;
        }
        byte[] raw = network.getPostbackSecretEnc();
        if (raw == null || raw.length == 0) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED,
                    "Postback secret not configured for network " + network.getCode());
        }
        return new String(raw, StandardCharsets.UTF_8);
    }
}
