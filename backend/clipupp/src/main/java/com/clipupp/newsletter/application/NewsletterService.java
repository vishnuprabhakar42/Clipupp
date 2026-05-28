package com.clipupp.newsletter.application;

import com.clipupp.auth.application.SecureTokens;
import com.clipupp.common.audit.AuditLogService;
import com.clipupp.common.error.ApiException;
import com.clipupp.common.outbox.OutboxService;
import com.clipupp.newsletter.domain.NewsletterSource;
import com.clipupp.newsletter.domain.NewsletterStatus;
import com.clipupp.newsletter.domain.NewsletterSubscription;
import com.clipupp.newsletter.infra.NewsletterSubscriptionRepository;
import com.clipupp.notifications.application.EmailDispatcher;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Newsletter signup with double opt-in. State machine:
 *
 * <pre>
 *   (new email)        ── PENDING ── confirm() ──→ CONFIRMED
 *   (already CONFIRMED) ── re-subscribe ──→ no-op (resend confirm if requested)
 *   (UNSUBSCRIBED)      ── re-subscribe ──→ PENDING (new confirm token)
 * </pre>
 *
 * <p>Anti-enumeration: {@link #subscribe} always returns success-shape; the
 * confirm/unsubscribe endpoints distinguish only between "valid token" and
 * "invalid/expired" — never leak whether an email exists in the system.
 */
@Service
public class NewsletterService {

    private static final Logger log = LoggerFactory.getLogger(NewsletterService.class);

    private final NewsletterSubscriptionRepository repo;
    private final OutboxService outbox;
    private final AuditLogService audit;
    private final String publicSiteUrl;

    public NewsletterService(NewsletterSubscriptionRepository repo,
                             OutboxService outbox,
                             AuditLogService audit,
                             @Value("${clipupp.public-site-url:http://localhost:3000}")
                             String publicSiteUrl) {
        this.repo = repo;
        this.outbox = outbox;
        this.audit = audit;
        this.publicSiteUrl = publicSiteUrl;
    }

    public record SubscribeResult(NewsletterStatus state, boolean confirmEmailSent) {}

    @Transactional
    public SubscribeResult subscribe(String rawEmail, String locale, NewsletterSource source) {
        String email = normalize(rawEmail);
        if (email == null) {
            // Always success-shaped for the caller, but log internally.
            log.warn("Newsletter subscribe with invalid email rejected");
            return new SubscribeResult(NewsletterStatus.PENDING, false);
        }
        Optional<NewsletterSubscription> existing = repo.findByEmail(email);
        if (existing.isPresent()) {
            NewsletterSubscription sub = existing.get();
            return switch (sub.getStatus()) {
                case CONFIRMED -> {
                    sub.setLocale(locale);
                    audit.record(null, "NEWSLETTER_RESUBSCRIBE_NOOP", "newsletter_subscription",
                            sub.getId(), Map.of("email", email));
                    yield new SubscribeResult(sub.getStatus(), false);
                }
                case PENDING -> {
                    String confirmToken = SecureTokens.generate();
                    sub.rotateConfirmation(SecureTokens.hash(confirmToken));
                    sub.setLocale(locale);
                    sendConfirmEmail(sub, confirmToken);
                    audit.record(null, "NEWSLETTER_RESEND_CONFIRM", "newsletter_subscription",
                            sub.getId(), Map.of("email", email));
                    yield new SubscribeResult(NewsletterStatus.PENDING, true);
                }
                case UNSUBSCRIBED -> {
                    String confirmToken = SecureTokens.generate();
                    sub.rotateConfirmation(SecureTokens.hash(confirmToken));
                    sub.setLocale(locale);
                    sendConfirmEmail(sub, confirmToken);
                    audit.record(null, "NEWSLETTER_REACTIVATE", "newsletter_subscription",
                            sub.getId(), Map.of("email", email));
                    yield new SubscribeResult(NewsletterStatus.PENDING, true);
                }
            };
        }

        String confirmToken = SecureTokens.generate();
        String unsubscribeToken = SecureTokens.generate();
        NewsletterSubscription sub = NewsletterSubscription.pending(
                email, locale,
                SecureTokens.hash(confirmToken),
                SecureTokens.hash(unsubscribeToken),
                source);
        NewsletterSubscription saved = repo.save(sub);
        sendConfirmEmail(saved, confirmToken);
        audit.record(null, "NEWSLETTER_SUBSCRIBE", "newsletter_subscription", saved.getId(),
                Map.of("email", email));
        return new SubscribeResult(NewsletterStatus.PENDING, true);
    }

    @Transactional
    public NewsletterSubscription confirm(String token) {
        if (token == null || token.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TOKEN_INVALID", "Missing token");
        }
        NewsletterSubscription sub = repo.findByConfirmTokenHash(SecureTokens.hash(token))
                .orElseThrow(() -> new ApiException(HttpStatus.GONE, "TOKEN_INVALID",
                        "Confirmation link is invalid or already used"));
        if (sub.getStatus() == NewsletterStatus.CONFIRMED) {
            return sub;   // idempotent
        }
        sub.confirm();
        sendConfirmedEmail(sub);
        audit.record(null, "NEWSLETTER_CONFIRM", "newsletter_subscription", sub.getId(),
                Map.of("email", sub.getEmail()));
        return sub;
    }

    @Transactional
    public NewsletterSubscription unsubscribe(String token) {
        if (token == null || token.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TOKEN_INVALID", "Missing token");
        }
        NewsletterSubscription sub = repo.findByUnsubscribeTokenHash(SecureTokens.hash(token))
                .orElseThrow(() -> new ApiException(HttpStatus.GONE, "TOKEN_INVALID",
                        "Unsubscribe link is invalid"));
        if (sub.getStatus() != NewsletterStatus.UNSUBSCRIBED) {
            sub.unsubscribe();
            audit.record(null, "NEWSLETTER_UNSUBSCRIBE", "newsletter_subscription",
                    sub.getId(), Map.of("email", sub.getEmail()));
        }
        return sub;
    }

    /** Used by AuthService at registration time to opt the user in by default. */
    @Transactional
    public void linkUserAccount(UUID userId, String email) {
        repo.findByEmail(normalize(email)).ifPresent(s -> s.linkUser(userId));
    }

    private void sendConfirmEmail(NewsletterSubscription sub, String confirmTokenPlain) {
        String confirmUrl = publicSiteUrl + "/newsletter/confirm?token="
                + java.net.URLEncoder.encode(confirmTokenPlain, java.nio.charset.StandardCharsets.UTF_8);
        outbox.enqueue(EmailDispatcher.TOPIC, Map.of(
                "to", sub.getEmail(),
                "locale", sub.getLocale(),
                "templateId", "newsletter-confirm",
                "model", Map.of(
                        "email", sub.getEmail(),
                        "confirmUrl", confirmUrl
                )));
    }

    private void sendConfirmedEmail(NewsletterSubscription sub) {
        String unsubscribeUrl = publicSiteUrl + "/newsletter/unsubscribe?token=__BASE64ENCODED__";
        // The plaintext unsubscribe token isn't reconstructable here (we only kept its hash) —
        // the welcome message points users at /account/preferences for opt-out instead. Each
        // weekly digest carries a rotating signed unsubscribe URL that does include the token.
        outbox.enqueue(EmailDispatcher.TOPIC, Map.of(
                "to", sub.getEmail(),
                "locale", sub.getLocale(),
                "templateId", "newsletter-confirmed",
                "model", Map.of(
                        "email", sub.getEmail(),
                        "preferencesUrl", publicSiteUrl + "/account/preferences"
                )));
    }

    private static String normalize(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim().toLowerCase();
        if (trimmed.isEmpty() || !trimmed.contains("@") || trimmed.length() > 254) return null;
        return trimmed;
    }
}
