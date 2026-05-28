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
import java.time.format.DateTimeParseException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * impact.com postback adapter. Production network adapters always look the
 * same at the seams: verify, parse, return a normalized {@link Postback}.
 * Field mapping below is from impact's "Action Tracker" S2S spec — when the
 * seller spins up a new program in the impact UI we just paste the headers
 * and body shape they show into the unit-test fixtures.
 */
@Component
public class ImpactAdapter implements NetworkAdapter {

    public static final String CODE = "impact";

    private static final String SIG_HEADER = "X-Impact-Signature";
    private static final String TS_HEADER = "X-Impact-Timestamp";

    private final HmacVerifier hmac;
    private final ObjectMapper json;

    public ImpactAdapter(HmacVerifier hmac, ObjectMapper json) {
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
        String txnId = required(root, "ActionId");
        UUID clickId = parseUuid(root.path("SubId1").asText(null));
        ConversionStatusHint status = mapStatus(root.path("State").asText("PENDING"));
        BigDecimal sale = optionalDecimal(root, "Amount");
        String saleCcy = root.path("Currency").asText(null);
        BigDecimal commission = optionalDecimal(root, "Payout");
        String commissionCcy = root.path("PayoutCurrency").asText(saleCcy);
        OffsetDateTime reportedAt = parseTime(root.path("EventDate").asText(null));
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

    private static ConversionStatusHint mapStatus(String state) {
        return switch (state.toUpperCase()) {
            case "APPROVED", "LOCKED", "PAID" -> ConversionStatusHint.APPROVED;
            case "REJECTED", "REVERSED-REJECTED" -> ConversionStatusHint.REJECTED;
            case "REVERSED" -> ConversionStatusHint.REVERSED;
            default -> ConversionStatusHint.PENDING;
        };
    }
}
