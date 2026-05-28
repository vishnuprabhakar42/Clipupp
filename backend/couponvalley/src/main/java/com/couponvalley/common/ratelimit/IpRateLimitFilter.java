package com.couponvalley.common.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Per-IP token-bucket rate limiter for unauthenticated public endpoints.
 *
 * <p>Buckets live in an in-memory {@link ConcurrentHashMap} keyed by client IP.
 * The bucket holds {@code limit} tokens and refills linearly over {@code window}.
 * On exhaustion the filter returns HTTP 429 with a {@code Retry-After} header.
 *
 * <p><b>Scope</b>: applies only to GET requests under the public catalog +
 * search + blog + settings + banners + homepage + redirect path families.
 * Authenticated endpoints (admin, account) bypass this filter — they're
 * gated by JWT already and per-IP limiting on a logged-in user is hostile.
 *
 * <p><b>Multi-instance caveat</b>: in-memory means each node enforces
 * independently. For Phase 1 (single Railway instance) that's fine; if we
 * horizontally scale, swap the backing store for a Redis-backed Bucket4j
 * proxy (one-line change in {@link #resolveBucket}).
 */
@Component
@ConditionalOnProperty(prefix = "couponvalley.ratelimit", name = "enabled",
        havingValue = "true", matchIfMissing = true)
public class IpRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(IpRateLimitFilter.class);

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final long limit;
    private final Duration window;

    public IpRateLimitFilter(
            @Value("${couponvalley.ratelimit.public-per-min:120}") long limit,
            @Value("${couponvalley.ratelimit.window-seconds:60}") long windowSeconds) {
        this.limit = limit;
        this.window = Duration.ofSeconds(windowSeconds);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Only rate-limit GET (read-heavy public endpoints). POST/PUT/DELETE on
        // public surfaces (newsletter subscribe, etc.) have their own backend
        // throttles via idempotency keys + per-email constraints.
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return !isPublicPath(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws IOException, ServletException {
        String ip = clientIp(req);
        Bucket bucket = resolveBucket(ip);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            res.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            res.setHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
            chain.doFilter(req, res);
            return;
        }
        long retryAfterSeconds = Math.max(1L, probe.getNanosToWaitForRefill() / 1_000_000_000L);
        log.warn("rate_limited ip={} path={} retry_after={}s",
                ip, req.getRequestURI(), retryAfterSeconds);
        res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        res.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        res.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        res.setHeader("X-RateLimit-Remaining", "0");
        res.setContentType("application/json");
        res.getWriter().write(
                "{\"code\":\"RATE_LIMITED\",\"status\":429,\"title\":\"Too many requests\"," +
                "\"detail\":\"Slow down and try again in " + retryAfterSeconds + "s.\"}");
    }

    private Bucket resolveBucket(String ip) {
        return buckets.computeIfAbsent(ip, k -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(limit)
                        .refillGreedy(limit, window)
                        .build())
                .build());
    }

    /**
     * Resolves the originating client IP. Behind a reverse proxy (Railway,
     * Cloudflare) the real IP is in {@code X-Forwarded-For}; the leftmost
     * entry is the true client. Falls back to the socket remote address.
     */
    private static String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            return (comma > 0 ? xff.substring(0, comma) : xff).trim();
        }
        return req.getRemoteAddr();
    }

    /**
     * Catalogues every public-read path family that needs throttling. Mirrors
     * the permitAll list in SecurityConfig — kept in sync by convention, not
     * code-shared, because the two filters serve different purposes.
     */
    private static boolean isPublicPath(String path) {
        return path.startsWith("/api/v1/stores")
                || path.startsWith("/api/v1/coupons")
                || path.startsWith("/api/v1/categories")
                || path.startsWith("/api/v1/offers")
                || path.startsWith("/api/v1/blog")
                || path.startsWith("/api/v1/banners")
                || path.startsWith("/api/v1/legal-pages")
                || path.startsWith("/api/v1/homepage")
                || path.startsWith("/api/v1/settings/public")
                || path.startsWith("/api/v1/campaigns")
                || path.startsWith("/api/v1/search")
                || path.startsWith("/r/")
                || path.equals("/sitemap.xml")
                || path.startsWith("/sitemaps/")
                || path.equals("/robots.txt");
    }
}
