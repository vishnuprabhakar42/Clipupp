package com.couponvalley.common.config;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

@Configuration
public class MediaConfig {

    /**
     * Cloudflare R2 is S3-compatible BUT requires:
     *   • path-style addressing  (https://endpoint/bucket/key  — not host-style)
     *   • checksum validation disabled on the response (R2 doesn't ship
     *     the same checksum trailer AWS does, so the v2 SDK will throw on
     *     it otherwise).
     *
     * Without `pathStyleAccessEnabled` the v2 SDK builds URLs like
     * `https://<bucket>.<account>.r2.cloudflarestorage.com/<key>`, which
     * R2 returns "NoSuchBucket" for — hence uploads silently fail in dev.
     */
    @Bean
    public S3Client s3Client(
            @Value("${couponvalley.media.s3-endpoint:}") String endpoint,
            @Value("${couponvalley.media.s3-region:auto}") String region,
            @Value("${couponvalley.media.access-key:dev}") String accessKey,
            @Value("${couponvalley.media.secret-key:dev}") String secretKey) {

        var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build());

        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }
        return builder.build();
    }

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}
