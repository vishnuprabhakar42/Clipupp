package com.couponvalley.notifications.application;

import java.util.Map;

/**
 * Outbound email port. Phase 1 ships a {@code LoggingEmailAdapter} that
 * structured-logs the message. Production swaps in a Resend or SES adapter
 * — same contract, no caller change.
 */
public interface EmailAdapter {
    void send(String toEmail, String locale, String templateId, Map<String, Object> model);
}
