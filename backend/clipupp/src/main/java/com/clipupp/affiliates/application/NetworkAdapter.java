package com.clipupp.affiliates.application;

import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * One implementation per affiliate network. Adapters know how to:
 * <ul>
 *   <li>Verify the inbound postback signature (HMAC, IP allowlist, timestamp window)</li>
 *   <li>Parse the network-specific payload into our normalized {@link Postback} record</li>
 * </ul>
 *
 * <p>Click-side templating is shared across networks via
 * {@link LinkTemplateEngine} — the only thing each adapter contributes there
 * is the deeplink template stored on the {@code merchant_network_link} row.
 */
public interface NetworkAdapter {

    /** Network short code, e.g. "impact". Must match {@code affiliate_network.code}. */
    String code();

    /**
     * Verify the request's authenticity. Adapters that don't support HMAC
     * (uncommon) should still implement IP allowlist + timestamp checks here.
     * Throws {@link com.clipupp.common.error.ApiException} on failure
     * (401 for bad sig, 422 for malformed body).
     */
    void verifyPostback(HttpServletRequest request, byte[] body, String secret);

    /** Map the network's payload into a normalized record. */
    Postback parsePostback(byte[] body) throws Exception;

    /**
     * Normalized postback shape. {@code networkTxnId} is the dedup key — most
     * networks use an order/transaction id; ours has uniqueness on
     * (network_id, network_txn_id).
     */
    record Postback(
            String networkTxnId,
            UUID clickId,                  // null if network couldn't echo our sub_id
            ConversionStatusHint status,
            BigDecimal orderAmount,
            String orderCurrency,
            BigDecimal commissionAmount,
            String commissionCurrency,
            OffsetDateTime reportedAt,
            String rawJson
    ) {}

    enum ConversionStatusHint { PENDING, APPROVED, REJECTED, REVERSED }
}
