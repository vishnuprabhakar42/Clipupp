package com.clipupp.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "oauth_account")
public class OAuthAccount {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "provider", nullable = false, length = 30)
    private String provider;

    @Column(name = "provider_user_id", nullable = false, length = 200)
    private String providerUserId;

    @Column(name = "email_at_provider", columnDefinition = "citext")
    private String emailAtProvider;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    protected OAuthAccount() {}

    public static OAuthAccount link(UUID userId, String provider, String providerUserId, String emailAtProvider) {
        OAuthAccount a = new OAuthAccount();
        a.id = UUID.randomUUID();
        a.userId = userId;
        a.provider = provider;
        a.providerUserId = providerUserId;
        a.emailAtProvider = emailAtProvider;
        return a;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getProvider() { return provider; }
    public String getProviderUserId() { return providerUserId; }
    public String getEmailAtProvider() { return emailAtProvider; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
