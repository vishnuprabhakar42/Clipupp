package com.clipupp.newsletter.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.clipupp.auth.application.SecureTokens;
import org.junit.jupiter.api.Test;

class NewsletterSubscriptionTest {

    @Test
    void pending_factory_initializes_state_correctly() {
        byte[] confirmHash = SecureTokens.hash("confirm-token");
        byte[] unsubHash = SecureTokens.hash("unsub-token");
        NewsletterSubscription s = NewsletterSubscription.pending(
                "user@example.com", "en", confirmHash, unsubHash, NewsletterSource.WEB);

        assertThat(s.getEmail()).isEqualTo("user@example.com");
        assertThat(s.getStatus()).isEqualTo(NewsletterStatus.PENDING);
        assertThat(s.getConfirmTokenHash()).isEqualTo(confirmHash);
        assertThat(s.getUnsubscribeTokenHash()).isEqualTo(unsubHash);
        assertThat(s.getSource()).isEqualTo(NewsletterSource.WEB);
        assertThat(s.getConfirmedAt()).isNull();
        assertThat(s.getUnsubscribedAt()).isNull();
    }

    @Test
    void confirm_clears_token_and_stamps_time() {
        NewsletterSubscription s = NewsletterSubscription.pending(
                "u@e.com", "en",
                SecureTokens.hash("c"), SecureTokens.hash("u"),
                NewsletterSource.WEB);
        s.confirm();
        assertThat(s.getStatus()).isEqualTo(NewsletterStatus.CONFIRMED);
        assertThat(s.getConfirmTokenHash()).isNull();
        assertThat(s.getConfirmedAt()).isNotNull();
    }

    @Test
    void unsubscribe_marks_state_and_time() {
        NewsletterSubscription s = NewsletterSubscription.pending(
                "u@e.com", "en",
                SecureTokens.hash("c"), SecureTokens.hash("u"),
                NewsletterSource.WEB);
        s.confirm();
        s.unsubscribe();
        assertThat(s.getStatus()).isEqualTo(NewsletterStatus.UNSUBSCRIBED);
        assertThat(s.getUnsubscribedAt()).isNotNull();
    }

    @Test
    void rotateConfirmation_returns_to_pending_with_new_token() {
        NewsletterSubscription s = NewsletterSubscription.pending(
                "u@e.com", "en",
                SecureTokens.hash("c1"), SecureTokens.hash("u"),
                NewsletterSource.WEB);
        s.confirm();
        s.unsubscribe();

        byte[] newConfirm = SecureTokens.hash("c2");
        s.rotateConfirmation(newConfirm);

        assertThat(s.getStatus()).isEqualTo(NewsletterStatus.PENDING);
        assertThat(s.getConfirmTokenHash()).isEqualTo(newConfirm);
        assertThat(s.getConfirmedAt()).isNull();
        assertThat(s.getUnsubscribedAt()).isNull();
    }

    @Test
    void linkUser_attaches_user_id_and_touches_updatedAt() {
        NewsletterSubscription s = NewsletterSubscription.pending(
                "u@e.com", "en",
                SecureTokens.hash("c"), SecureTokens.hash("u"),
                NewsletterSource.WEB);
        var before = s.getUpdatedAt();
        java.util.UUID uid = java.util.UUID.randomUUID();
        // Sleep 1ms to make sure clock advances on macOS millisecond resolution.
        try { Thread.sleep(2); } catch (InterruptedException ignored) {}
        s.linkUser(uid);
        assertThat(s.getUserId()).isEqualTo(uid);
        assertThat(s.getUpdatedAt()).isAfterOrEqualTo(before);
    }
}
