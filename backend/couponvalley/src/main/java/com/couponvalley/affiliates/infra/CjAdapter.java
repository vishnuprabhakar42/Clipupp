package com.couponvalley.affiliates.infra;

import com.couponvalley.affiliates.application.HmacVerifier;
import com.couponvalley.affiliates.application.NetworkAdapter;
import com.couponvalley.common.error.ApiException;
import com.couponvalley.common.error.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * CJ.com (Commission Junction) adapter. CJ's S2S postback uses an
 * {@code X-CJ-Signature} header over the raw body (see CJ's "Real-Time
 * Transactions" docs). Field names are CJ-flavored {@code event-date},
 * {@code commission-id}, etc. — captured below in {@link #parsePostback}.
 */
@Component
public class CjAdapter implements NetworkAdapter {

    public static final String CODE = "cj";

    private static final String SIG_HEADER = "X-CJ-Signature";
    private static final String TS_HEADER = "X-CJ-Timestamp";

    private final HmacVerifier hmac;
    private final ObjectMapper json;

    public CjAdapter(HmacVerifier hmac, ObjectMapper json) {
        this.hmac = hmac;
        this.json = json;
    }

    @Override public String code() { return CODE; }

    @Override
    public void verifyPostback(HttpServletRequest request, byte[] body, String secret) {
        hmac.verify(body, request.getHeader(SIG_HEADER), request.getHeader(TS_HEADER), secret);
    }

    @Override
    public Postback parsePostback(byte[] body) throws Exception {
        JsonNode root = json.readTree(body);
        String txnId = required(root, "commission-id");
        UUID clickId = parseUuid(root.path("sid").asText(null));
        ConversionStatusHint status = mapStatus(root.path("action-status").asText("EXTENDED"));
        BigDecimal sale = optionalDecimal(root, "sale-amount");
        String saleCcy = root.path("sale-currency").asText("USD");
        BigDecimal commission = optionalDecimal(root, "commission-amount");
        String commissionCcy = root.path("commission-currency").asText(saleCcy);
        OffsetDateTime reportedAt = parseTime(root.path("event-date").asText(null));
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
        try { return OffsetDateTime.parse(s); } catch (DateTimeParseException ex) { return null; }
    }

    private static ConversionStatusHint mapStatus(String s) {
        return switch (s.toUpperCase()) {
            case "LOCKED", "PAID", "APPROVED" -> ConversionStatusHint.APPROVED;
            case "DECLINED", "CORRECTED" -> ConversionStatusHint.REJECTED;
            case "REVERSED" -> ConversionStatusHint.REVERSED;
            default -> ConversionStatusHint.PENDING;
        };
    }
}
