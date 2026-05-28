package com.clipupp.users.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_preference")
public class UserPreference {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "preferred_currency", nullable = false, length = 3)
    private String preferredCurrency = "INR";

    @Column(name = "email_opt_in", nullable = false)
    private boolean emailOptIn = true;

    @Column(name = "weekly_digest_opt_in", nullable = false)
    private boolean weeklyDigestOptIn = true;

    @Column(name = "marketing_opt_in", nullable = false)
    private boolean marketingOptIn = false;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected UserPreference() {}

    public UserPreference(UUID userId) {
        this.userId = userId;
    }

    public void touch() { this.updatedAt = OffsetDateTime.now(); }

    public UUID getUserId() { return userId; }
    public String getPreferredCurrency() { return preferredCurrency; }
    public void setPreferredCurrency(String c) { this.preferredCurrency = c; }
    public boolean isEmailOptIn() { return emailOptIn; }
    public void setEmailOptIn(boolean v) { this.emailOptIn = v; }
    public boolean isWeeklyDigestOptIn() { return weeklyDigestOptIn; }
    public void setWeeklyDigestOptIn(boolean v) { this.weeklyDigestOptIn = v; }
    public boolean isMarketingOptIn() { return marketingOptIn; }
    public void setMarketingOptIn(boolean v) { this.marketingOptIn = v; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
