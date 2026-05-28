package com.clipupp.affiliates.infra;

import com.clipupp.affiliates.application.HmacVerifier;
import com.clipupp.affiliates.application.NetworkAdapter;
import com.clipupp.common.error.ApiException;
import com.clipupp.common.error.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.http.HttpStatus;

/**
 * Generic JSON postback adapter for networks we haven't custom-mapped yet.
 * Awin / Rakuten Advertising / Admitad each register a {@link StubAdapter}
 * subclass under their own code; once a real spec lands the parsePostback()
 * is overridden.
 *
 * <p>Default verification: {@code X-Signature} header (hex HMAC-SHA256) over
 * the raw body, plus an optional {@code X-Timestamp} for the freshness check.
 * Default parsing assumes a generic {@code {txnId, subId, status, amount,
 * commission}} body shape.
 */
public abstract class StubAdapter implements NetworkAdapter {

    private final HmacVerifier hmac;
    protected final ObjectMapper json;

    protected StubAdapter(HmacVerifier hmac, ObjectMapper json) {
        this.hmac = hmac;
        this.json = json;
    }

    @Override
    public void verifyPostback(HttpServletRequest request, byte[] body, String secret) {
        hmac.verify(body, request.getHeader("X-Signature"), request.getHeader("X-Timestamp"), secret);
    }

    @Override
    public Postback parsePostback(byte[] body) throws Exception {
        JsonNode root = json.readTree(body);
        String txnId = required(root, "txnId");
        UUID clickId = parseUuid(root.path("subId").asText(null));
        ConversionStatusHint status = ConversionStatusHint.valueOf(
                root.path("status").asText("PENDING").toUpperCase());
        BigDecimal sale = optionalDecimal(root, "amount");
        String saleCcy = root.path("currency").asText(null);
        BigDecimal commission = optionalDecimal(root, "commission");
        String commissionCcy = root.path("commissionCurrency").asText(saleCcy);
        OffsetDateTime reportedAt = parseTime(root.path("reportedAt").asText(null));
        return new Postback(txnId, clickId, status, sale, saleCcy, commission, commissionCcy,
                reportedAt, json.writeValueAsString(root));
    }

    private static String required(JsonNode root, String field) {
        String v = root.path(field).asText(null);
        if (v == null || v.isBlank()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_FAILED,
                    "Missing required field: " + field);
        }
        return v;
    }

    private static UUID parseUuid(String s) {
        if (s == null || s.isBlank()) return null;
        try { return UUID.fromString(s); } catch (IllegalArgumentException ex) { return null; }
    }

    private static BigDecimal optionalDecimal(JsonNode root, String field) {
        if (!root.has(field) || root.path(field).isNull()) return null;
        try { return new BigDecimal(root.path(field).asText()); }
        catch (NumberFormatException ex) { return null; }
    }

    private static OffsetDateTime parseTime(String s) {
        if (s == null || s.isBlank()) return null;
        try { return OffsetDateTime.parse(s); } catch (Exception ex) { return null; }
    }
}
