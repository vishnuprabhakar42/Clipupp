package com.clipupp.notifications.infra;

import com.clipupp.notifications.application.EmailAdapter;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Phase 1 default email adapter. Logs the rendered email envelope at INFO
 * with structured fields so developers can copy verification / reset URLs
 * out of the console without standing up a real SMTP relay.
 *
 * <p>Phase 1 ships only this implementation — registered unconditionally so
 * the app always boots. When a real provider (e.g. a future
 * {@code ResendEmailAdapter}) is added later, gate it with
 * {@code @ConditionalOnProperty(name = "clipupp.email.provider",
 * havingValue = "resend")} and add {@code @ConditionalOnMissingBean} here.
 */
@Component
public class LoggingEmailAdapter implements EmailAdapter {

    private static final Logger log = LoggerFactory.getLogger(LoggingEmailAdapter.class);

    private final String from;

    public LoggingEmailAdapter(@Value("${clipupp.email.from}") String from) {
        this.from = from;
    }

    @Override
    public void send(String toEmail, String locale, String templateId, Map<String, Object> model) {
        log.info("EMAIL [{}] from={} to={} locale={} model={}",
                templateId, from, toEmail, locale, model);
    }
}
