package com.clipupp.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "email_verification_token")
public class EmailVerificationToken {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "token_hash", nullable = false)
    private byte[] tokenHash;

    @Column(name = "used_at")
    private OffsetDateTime usedAt;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    protected EmailVerificationToken() {}

    public static EmailVerificationToken issue(UUID userId, byte[] tokenHash, OffsetDateTime expiresAt) {
        EmailVerificationToken t = new EmailVerificationToken();
        t.id = UUID.randomUUID();
        t.userId = userId;
        t.tokenHash = tokenHash;
        t.expiresAt = expiresAt;
        return t;
    }

    public boolean isUsed()    { return usedAt != null; }
    public boolean isExpired() { return expiresAt.isBefore(OffsetDateTime.now()); }
    public boolean isValid()   { return !isUsed() && !isExpired(); }
    public void markUsed()     { this.usedAt = OffsetDateTime.now(); }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public byte[] getTokenHash() { return tokenHash; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
}
