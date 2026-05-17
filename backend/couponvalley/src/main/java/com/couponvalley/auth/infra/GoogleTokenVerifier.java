package com.couponvalley.auth.infra;

import com.couponvalley.common.error.ApiException;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Verifies a Google ID token by calling Google's tokeninfo endpoint.
 * Does not require the Google client library — uses a plain HTTP call.
 */
@Component
public class GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifier.class);
    private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private final String clientId;
    private final RestClient restClient;

    public GoogleTokenVerifier(
            @Value("${couponvalley.google.client-id:}") String clientId,
            RestClient.Builder builder) {
        this.clientId = clientId;
        this.restClient = builder.build();
    }

    public record GoogleTokenInfo(String sub, String email, String name, String picture) {}

    public GoogleTokenInfo verify(String idToken) {
        if (clientId == null || clientId.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "OAUTH_NOT_CONFIGURED",
                    "Google OAuth is not configured on this server");
        }
        TokenInfoResponse resp;
        try {
            resp = restClient.get()
                    .uri(TOKEN_INFO_URL + "?id_token=" + idToken)
                    .retrieve()
                    .body(TokenInfoResponse.class);
        } catch (RestClientException ex) {
            log.warn("Google tokeninfo call failed: {}", ex.getMessage());
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN",
                    "Google token verification failed");
        }

        if (resp == null || resp.sub() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN",
                    "Invalid or expired Google token");
        }
        if (!clientId.equals(resp.aud())) {
            log.warn("Google token audience mismatch: got={} expected={}", resp.aud(), clientId);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN",
                    "Token audience does not match this application");
        }
        long nowEpoch = Instant.now().getEpochSecond();
        if (resp.exp() != null && Long.parseLong(resp.exp()) < nowEpoch) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN",
                    "Google token has expired");
        }
        return new GoogleTokenInfo(resp.sub(), resp.email(), resp.name(), resp.picture());
    }

    private record TokenInfoResponse(
            String sub,
            String aud,
            String email,
            String name,
            String picture,
            String exp,
            @JsonProperty("email_verified") String emailVerified
    ) {}
}
