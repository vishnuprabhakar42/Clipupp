package com.couponvalley.newsletter.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "newsletter_subscription")
public class NewsletterSubscription {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "email", nullable = false, columnDefinition = "citext")
    private String email;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "locale", nullable = false, length = 10)
    private String locale = "en";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private NewsletterStatus status = NewsletterStatus.PENDING;

    @Column(name = "confirm_token_hash")
    private byte[] confirmTokenHash;

    @Column(name = "unsubscribe_token_hash", nullable = false)
    private byte[] unsubscribeTokenHash;

    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;

    @Column(name = "unsubscribed_at")
    private OffsetDateTime unsubscribedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 40)
    private NewsletterSource source = NewsletterSource.WEB;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected NewsletterSubscription() {}

    public static NewsletterSubscription pending(String email, String locale,
                                                 byte[] confirmTokenHash,
                                                 byte[] unsubscribeTokenHash,
                                                 NewsletterSource source) {
        NewsletterSubscription s = new NewsletterSubscription();
        s.id = UUID.randomUUID();
        s.email = email;
        s.locale = locale == null || locale.isBlank() ? "en" : locale;
        s.status = NewsletterStatus.PENDING;
        s.confirmTokenHash = confirmTokenHash;
        s.unsubscribeTokenHash = unsubscribeTokenHash;
        s.source = source == null ? NewsletterSource.WEB : source;
        return s;
    }

    public void confirm() {
        this.status = NewsletterStatus.CONFIRMED;
        this.confirmedAt = OffsetDateTime.now();
        this.confirmTokenHash = null;
        this.updatedAt = OffsetDateTime.now();
    }

    public void unsubscribe() {
        this.status = NewsletterStatus.UNSUBSCRIBED;
        this.unsubscribedAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public void rotateConfirmation(byte[] newConfirmTokenHash) {
        this.status = NewsletterStatus.PENDING;
        this.confirmTokenHash = newConfirmTokenHash;
        this.unsubscribedAt = null;
        this.confirmedAt = null;
        this.updatedAt = OffsetDateTime.now();
    }

    public void linkUser(UUID userId) {
        this.userId = userId;
        this.updatedAt = OffsetDateTime.now();
    }

    public void setLocale(String locale) {
        if (locale != null && !locale.isBlank()) {
            this.locale = locale;
            this.updatedAt = OffsetDateTime.now();
        }
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public UUID getUserId() { return userId; }
    public String getLocale() { return locale; }
    public NewsletterStatus getStatus() { return status; }
    public byte[] getConfirmTokenHash() { return confirmTokenHash; }
    public byte[] getUnsubscribeTokenHash() { return unsubscribeTokenHash; }
    public OffsetDateTime getConfirmedAt() { return confirmedAt; }
    public OffsetDateTime getUnsubscribedAt() { return unsubscribedAt; }
    public NewsletterSource getSource() { return source; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
