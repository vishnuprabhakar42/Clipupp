package com.clipupp.common.config;

import com.clipupp.auth.infra.JwtAuthenticationFilter;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Default-deny security config. Sprint 0 establishes the public allowlist,
 * disables CSRF (we use Bearer tokens; the only cookie-auth endpoint will be
 * /api/v1/auth/refresh which gets a double-submit token in Sprint 1), and
 * declares stateless sessions.
 *
 * <p>Sprint 1 will add the JWT authentication filter that populates the
 * SecurityContext from {@code Authorization: Bearer ...} headers.
 */
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final String allowedOriginsCsv;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final boolean isProd;
    private final boolean docsPublic;

    public SecurityConfig(@Value("${clipupp.cors.allowed-origins}") String allowedOriginsCsv,
                          @Value("${clipupp.api-docs.public:false}") boolean docsPublic,
                          JwtAuthenticationFilter jwtAuthenticationFilter,
                          Environment env) {
        this.allowedOriginsCsv = allowedOriginsCsv;
        this.docsPublic = docsPublic;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.isProd = env.acceptsProfiles(Profiles.of("prod"));
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            // Spring Security's default CacheControlHeadersWriter unconditionally
            // sets `Cache-Control: no-cache, no-store, max-age=0, must-revalidate`
            // on every response — even when the controller has already set
            // `Cache-Control: max-age=60, stale-while-revalidate=5m`. That
            // silently undoes the public-catalog SWR caching strategy.
            //
            // Fix: disable the default writer, then add a conditional one that
            // only injects no-store when the response doesn't already carry a
            // Cache-Control header. Controllers (public stores/coupons/etc.)
            // that explicitly set caching keep their headers; everything else
            // (admin/auth/account) still gets the protective no-store default.
            .headers(h -> h
                .cacheControl(c -> c.disable())
                .addHeaderWriter((req, res) -> {
                    if (!res.containsHeader("Cache-Control")) {
                        res.setHeader("Cache-Control",
                                "no-cache, no-store, max-age=0, must-revalidate");
                        res.setHeader("Pragma", "no-cache");
                        res.setHeader("Expires", "0");
                    }
                })
            )
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Return 401 (not the Spring default 403) when a protected
            // endpoint is hit without authentication. The frontend's auto-
            // refresh logic in lib/api/client.ts retries on 401 only — so
            // returning 401 here is what makes the silent refresh work.
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, authEx) -> {
                    res.setStatus(HttpStatus.UNAUTHORIZED.value());
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.getWriter().write(
                            "{\"code\":\"UNAUTHORIZED\",\"status\":401,\"title\":\"Authentication required\"}");
                })
                .accessDeniedHandler((req, res, denied) -> {
                    res.setStatus(HttpStatus.FORBIDDEN.value());
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    res.getWriter().write(
                            "{\"code\":\"FORBIDDEN\",\"status\":403,\"title\":\"Insufficient permissions\"}");
                })
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // Public auth endpoints (includes /api/v1/auth/oauth2/*)
                .requestMatchers("/api/v1/auth/**").permitAll()
                // Dev-only seed endpoint — controller is @Profile("dev") so absent in prod
                .requestMatchers("/api/v1/dev/**").permitAll()
                // Public read-only catalog
                .requestMatchers(HttpMethod.GET, "/api/v1/stores/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/coupons/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/offers/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/blog/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/banners/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/legal-pages/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/homepage", "/api/v1/homepage/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/settings/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/campaigns/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/search", "/api/v1/search/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/newsletter/subscribe").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/newsletter/confirm",
                        "/api/v1/newsletter/unsubscribe").permitAll()
                // Outbound redirect + affiliate postbacks
                .requestMatchers("/r/**", "/postback/**").permitAll()
                // Health + docs. Swagger UI + raw OpenAPI doc are PUBLIC on
                // dev. In prod they're locked down by default; set
                // CLIPUPP_API_DOCS_PUBLIC=true (and SPRINGDOC_*_ENABLED=true) to
                // expose them temporarily for QA without rebuilding the image.
                .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                .requestMatchers((isProd && !docsPublic)
                        ? new String[] { "/api/v1/ping" }
                        : new String[] { "/api/v1/ping", "/v3/api-docs/**",
                                "/swagger-ui.html", "/swagger-ui/**" }).permitAll()
                // SEO endpoints
                .requestMatchers("/sitemap.xml", "/sitemaps/**", "/robots.txt").permitAll()
                // Everything else requires auth
                .anyRequest().authenticated())
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(Arrays.stream(allowedOriginsCsv.split(",")).map(String::trim).toList());
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-Id", "Idempotency-Key", "X-CSRF-Token"));
        cfg.setExposedHeaders(List.of("X-Request-Id"));
        // Credentials only required on cookie-auth endpoints (refresh/logout); enabled globally for Phase 1 simplicity.
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration cfg)
            throws Exception {
        return cfg.getAuthenticationManager();
    }
}
