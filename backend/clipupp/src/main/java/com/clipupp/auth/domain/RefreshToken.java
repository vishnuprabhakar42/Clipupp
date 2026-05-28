package com.clipupp.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Server-side refresh-token record. The plain opaque token is never stored;
 * we hash it (SHA-256) and persist only the hash. Tokens are single-use:
 * each call to /auth/refresh marks the presented row {@code used} and issues
 * a new row whose {@code parentId} points at it. Replaying a {@code used}
 * row is treated as a compromised-session signal and revokes the entire chain.
 */
@Entity
@Table(name = "refresh_token")
public class RefreshToken {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "token_hash", nullable = false)
    private byte[] tokenHash;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "used_at")
    private OffsetDateTime usedAt;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "ip_inet", columnDefinition = "inet")
    private String ipInet;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    protected RefreshToken() {}

    public static RefreshToken issue(UUID userId, byte[] tokenHash, UUID parentId,
                                     String userAgent, String ipInet, OffsetDateTime expiresAt) {
        RefreshToken t = new RefreshToken();
        t.id = UUID.randomUUID();
        t.userId = userId;
        t.tokenHash = tokenHash;
        t.parentId = parentId;
        t.userAgent = userAgent;
        t.ipInet = ipInet;
        t.expiresAt = expiresAt;
        return t;
    }

    public boolean isUsed()    { return usedAt != null; }
    public boolean isRevoked() { return revokedAt != null; }
    public boolean isExpired() { return expiresAt.isBefore(OffsetDateTime.now()); }
    public boolean isValid()   { return !isUsed() && !isRevoked() && !isExpired(); }

    public void markUsed()    { this.usedAt = OffsetDateTime.now(); }
    public void revoke()      { this.revokedAt = OffsetDateTime.now(); }

    public UUID getId()         { return id; }
    public UUID getUserId()     { return userId; }
    public byte[] getTokenHash(){ return tokenHash; }
    public UUID getParentId()   { return parentId; }
    public OffsetDateTime getUsedAt()    { return usedAt; }
    public OffsetDateTime getRevokedAt() { return revokedAt; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public String getUserAgent()         { return userAgent; }
    public String getIpInet()            { return ipInet; }
}
