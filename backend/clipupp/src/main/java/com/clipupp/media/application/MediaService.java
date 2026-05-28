package com.clipupp.media.application;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class MediaService {

    private static final Logger log = LoggerFactory.getLogger(MediaService.class);
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml");
    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    private final String bucket;
    private final String publicBaseUrl;
    private final S3Client s3;

    public MediaService(
            @Value("${clipupp.media.bucket:}") String bucket,
            @Value("${clipupp.media.public-base-url:}") String publicBaseUrl,
            S3Client s3) {
        this.bucket = bucket;
        this.publicBaseUrl = publicBaseUrl;
        this.s3 = s3;
    }

    /** Surfaces the resolved R2 config on startup so misconfig is loud. */
    @PostConstruct
    void logConfig() {
        log.info("[MEDIA] R2 bucket=[{}] publicBaseUrl=[{}] envR2_BUCKET=[{}] envR2_PUBLIC_BASE_URL=[{}]",
                bucket, publicBaseUrl,
                System.getenv("R2_BUCKET"),
                System.getenv("R2_PUBLIC_BASE_URL"));
        if (bucket == null || bucket.isBlank()) {
            log.warn("[MEDIA] R2 NOT configured — uploads will return placeholder URLs. " +
                    "Set R2_BUCKET (and R2_PUBLIC_BASE_URL) before starting the JVM.");
        }
    }

    public String upload(MultipartFile file) {
        validateFile(file);

        if (bucket == null || bucket.isBlank()) {
            // Dev fallback — return a deterministic placeholder URL
            String label = URLEncoder.encode(
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "image",
                    StandardCharsets.UTF_8);
            log.info("R2 not configured (clipupp.media.bucket is empty) — returning placeholder for '{}'", label);
            return "https://placehold.co/400x400/4F46E5/FFFFFF?text=" + label;
        }

        if (publicBaseUrl == null || publicBaseUrl.isBlank()) {
            throw new IllegalStateException(
                "R2 bucket is configured but clipupp.media.public-base-url is empty. " +
                "Set R2_PUBLIC_BASE_URL to your bucket's public URL (eg. https://media.example.com or https://pub-<id>.r2.dev).");
        }

        String ext = extension(file.getOriginalFilename());
        String key = "uploads/" + UUID.randomUUID() + ext;
        try {
            PutObjectRequest req = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();
            s3.putObject(req, RequestBody.fromBytes(file.getBytes()));
            // Strip trailing slash from base so we don't end up with `…//uploads/…`
            String base = publicBaseUrl.endsWith("/")
                    ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                    : publicBaseUrl;
            String url = base + "/" + key;
            log.info("Uploaded media to R2: bucket={} key={} → {}", bucket, key, url);
            return url;
        } catch (IOException e) {
            log.error("Failed to read upload bytes from request", e);
            throw new RuntimeException("Failed to read upload content", e);
        } catch (RuntimeException e) {
            // Make S3 / R2 SDK errors visible in the response instead of a generic 500.
            log.error("R2 putObject failed for bucket={} key={}: {}", bucket, key, e.getMessage(), e);
            throw new IllegalStateException(
                "R2 upload failed: " + e.getMessage() +
                ". Check R2_ENDPOINT, R2_BUCKET, credentials, and that the bucket exists.",
                e);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("File exceeds 10 MB limit");
        }
        String ct = file.getContentType();
        if (ct == null || !ALLOWED_TYPES.contains(ct)) {
            throw new IllegalArgumentException("Unsupported file type: " + ct);
        }
    }

    private static String extension(String filename) {
        if (filename == null) return ".bin";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
