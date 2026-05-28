package com.clipupp.auth.api;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.OffsetDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Helpers for the {@code clipupp_rt} refresh-token cookie. HttpOnly + Secure +
 * SameSite=Lax so the Next.js server can read it on page navigations (needed
 * for getServerSession), while third-party cross-site requests still cannot
 * carry it.
 *
 * <p>Path is {@code /} so the cookie travels on top-level navigations like
 * {@code /admin} (a narrower scope would prevent that and break the SSR
 * session check). The token is short-lived, rotates on every refresh, and
 * remains JS-invisible thanks to HttpOnly.
 *
 * <p>Local dev relaxes Secure when {@code clipupp.cookie.secure=false}
 * so http://localhost works without HTTPS.
 */
@Component
public class RefreshCookie {

    public static final String NAME = "clipupp_rt";
    public static final String PATH = "/";

    private final boolean secure;

    public RefreshCookie(@Value("${clipupp.cookie.secure:true}") boolean secure) {
        this.secure = secure;
    }

    public void set(HttpServletResponse response, String token, OffsetDateTime expiresAt) {
        // Defensively clear any stale cookies from prior schemas (older
        // Path=/api/v1/auth scope). Without this, browsers carrying both
        // cookies send the older one first and Spring picks the wrong value.
        for (String legacyPath : new String[] { "/api/v1/auth", "/api/v1/auth/" }) {
            ResponseCookie clear = ResponseCookie.from(NAME, "")
                    .httpOnly(true)
                    .secure(secure)
                    .sameSite("Lax")
                    .path(legacyPath)
                    .maxAge(0)
                    .build();
            response.addHeader("Set-Cookie", clear.toString());
        }

        ResponseCookie cookie = ResponseCookie.from(NAME, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path(PATH)
                .maxAge(java.time.Duration.between(OffsetDateTime.now(), expiresAt))
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public void clear(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(NAME, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path(PATH)
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public String read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (NAME.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
