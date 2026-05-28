package com.clipupp.auth.infra;

import com.clipupp.auth.domain.Role;
import com.clipupp.common.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

/**
 * Issues and verifies access JWTs. HS256 in Phase 1 (single-instance, single
 * secret). Switching to RS256 + JWKS rotation is a Phase 2 swap-in: replace
 * {@code key} with a {@code KeyPair}, expose {@code /.well-known/jwks.json},
 * and update {@link #verify(String)} accordingly.
 */
@Component
public class JwtIssuer {

    private final JwtProperties props;
    private final SecretKey key;
    private final JwtParser parser;

    public JwtIssuer(JwtProperties props) {
        this.props = props;
        byte[] bytes = props.secret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "clipupp.jwt.secret must be at least 32 bytes (256 bits); got " + bytes.length);
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.parser = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(props.issuer())
                .requireAudience(props.audience())
                .build();
    }

    public String issueAccessToken(UUID userId, Set<Role> roles, String locale) {
        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofSeconds(props.accessTokenTtlSeconds()));
        return Jwts.builder()
                .issuer(props.issuer())
                .audience().add(props.audience()).and()
                .subject(userId.toString())
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claim("roles", roles.stream().map(Enum::name).toList())
                .claim("locale", locale)
                .signWith(key)
                .compact();
    }

    /** Returns parsed claims if the token is valid; throws {@link JwtException} otherwise. */
    public ParsedJwt verify(String compact) {
        Jws<Claims> jws = parser.parseSignedClaims(compact);
        Claims c = jws.getPayload();
        UUID userId = UUID.fromString(c.getSubject());
        @SuppressWarnings("unchecked")
        List<String> roleNames = c.get("roles", List.class);
        return new ParsedJwt(userId, roleNames == null ? List.of() : roleNames,
                (String) c.get("locale"), c.getId(), c.getExpiration().toInstant());
    }

    public long accessTokenTtlSeconds() {
        return props.accessTokenTtlSeconds();
    }

    public record ParsedJwt(UUID userId, List<String> roles, String locale, String jti, Instant expiresAt) {}

    /** Minimal Spring config that enables {@link JwtProperties} binding. */
    @Configuration
    @EnableConfigurationProperties(JwtProperties.class)
    static class JwtConfig {}
}
