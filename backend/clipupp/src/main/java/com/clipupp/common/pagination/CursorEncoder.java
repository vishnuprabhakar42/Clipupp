package com.clipupp.common.pagination;

import com.clipupp.common.error.ApiException;
import com.clipupp.common.error.ErrorCode;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.http.HttpStatus;

/**
 * Opaque pagination cursors. Two flavors:
 * <ul>
 *   <li>{@link OffsetCursor} — page number for admin/list endpoints that
 *       wrap Spring Data pagination directly. Compact and good enough for
 *       admin tables that aren't expected to drift under inserts.</li>
 *   <li>{@link KeyCursor} — composite (sortKey, id) for public catalog
 *       endpoints that need stable pagination under continuous inserts.</li>
 * </ul>
 *
 * <p>Cursors are base64url-encoded (no padding) with a 1-char type prefix so
 * the consumer never inspects them and the producer can evolve the shape.
 */
public final class CursorEncoder {

    private CursorEncoder() {}

    public sealed interface Cursor permits OffsetCursor, KeyCursor {}
    public record OffsetCursor(int page) implements Cursor {}
    public record KeyCursor(String sortKey, String id) implements Cursor {}

    private static final Base64.Encoder ENC = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DEC = Base64.getUrlDecoder();

    public static String encode(Cursor cursor) {
        String body;
        if (cursor instanceof OffsetCursor o) {
            body = "o:" + o.page;
        } else if (cursor instanceof KeyCursor k) {
            body = "k:" + escape(k.sortKey) + ":" + escape(k.id);
        } else {
            throw new IllegalArgumentException("unknown cursor variant");
        }
        return ENC.encodeToString(body.getBytes(StandardCharsets.UTF_8));
    }

    public static Cursor decode(String token) {
        if (token == null || token.isBlank()) return null;
        String decoded;
        try {
            decoded = new String(DEC.decode(token), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ErrorCode.MALFORMED_REQUEST, "Invalid cursor");
        }
        if (decoded.startsWith("o:")) {
            try {
                int page = Integer.parseInt(decoded.substring(2));
                if (page < 0) throw new NumberFormatException();
                return new OffsetCursor(page);
            } catch (NumberFormatException ex) {
                throw new ApiException(HttpStatus.BAD_REQUEST, ErrorCode.MALFORMED_REQUEST, "Invalid cursor");
            }
        }
        if (decoded.startsWith("k:")) {
            String[] parts = decoded.substring(2).split(":", 2);
            if (parts.length != 2) {
                throw new ApiException(HttpStatus.BAD_REQUEST, ErrorCode.MALFORMED_REQUEST, "Invalid cursor");
            }
            return new KeyCursor(unescape(parts[0]), unescape(parts[1]));
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, ErrorCode.MALFORMED_REQUEST, "Invalid cursor");
    }

    /** Returns 0 if no cursor provided; throws on a malformed cursor. */
    public static int decodePageOr(String token, int defaultPage) {
        if (token == null || token.isBlank()) return defaultPage;
        Cursor c = decode(token);
        if (c instanceof OffsetCursor o) return o.page;
        throw new ApiException(HttpStatus.BAD_REQUEST, ErrorCode.MALFORMED_REQUEST,
                "Cursor type does not match this endpoint");
    }

    private static String escape(String s) { return s.replace(":", "%3A"); }
    private static String unescape(String s) { return s.replace("%3A", ":"); }
}
