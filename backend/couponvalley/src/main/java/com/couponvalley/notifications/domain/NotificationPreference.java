package com.couponvalley.notifications.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Per-channel notification preferences for a user. Distinct from the simpler
 * {@code user_preference} flags from V002 — this table covers the engagement
 * channels Sprint 5+ deliver against (transactional, expiring-coupon
 * reminders, weekly digest, marketing).
 */
@Entity
@Table(name = "notification_preference")
public class NotificationPreference {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "product_email", nullable = false)
    private boolean productEmail = true;

    @Column(name = "expiring_email", nullable = false)
    private boolean expiringEmail = true;

    @Column(name = "digest_email", nullable = false)
    private boolean digestEmail = true;

    @Column(name = "marketing_email", nullable = false)
    private boolean marketingEmail = false;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected NotificationPreference() {}

    public NotificationPreference(UUID userId) {
        this.userId = userId;
    }

    public void touch() { this.updatedAt = OffsetDateTime.now(); }

    public UUID getUserId() { return userId; }
    public boolean isProductEmail() { return productEmail; }
    public void setProductEmail(boolean v) { this.productEmail = v; touch(); }
    public boolean isExpiringEmail() { return expiringEmail; }
    public void setExpiringEmail(boolean v) { this.expiringEmail = v; touch(); }
    public boolean isDigestEmail() { return digestEmail; }
    public void setDigestEmail(boolean v) { this.digestEmail = v; touch(); }
    public boolean isMarketingEmail() { return marketingEmail; }
    public void setMarketingEmail(boolean v) { this.marketingEmail = v; touch(); }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
