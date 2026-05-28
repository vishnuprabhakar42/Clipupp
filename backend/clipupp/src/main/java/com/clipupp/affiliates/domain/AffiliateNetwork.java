package com.clipupp.affiliates.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "affiliate_network")
public class AffiliateNetwork {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "code", nullable = false, length = 40, unique = true)
    private String code;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    /** pgcrypto-encrypted shared secret used for postback HMAC verification. */
    @Column(name = "postback_secret_enc")
    private byte[] postbackSecretEnc;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "config_json", nullable = false, columnDefinition = "jsonb")
    private String configJson = "{}";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected AffiliateNetwork() {}

    public static AffiliateNetwork create(String code, String name) {
        AffiliateNetwork n = new AffiliateNetwork();
        n.id = UUID.randomUUID();
        n.code = code;
        n.name = name;
        return n;
    }

    public void touch() { this.updatedAt = OffsetDateTime.now(); }

    public UUID getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String c) { this.code = c; touch(); }
    public String getName() { return name; }
    public void setName(String n) { this.name = n; touch(); }
    public byte[] getPostbackSecretEnc() { return postbackSecretEnc; }
    public void setPostbackSecretEnc(byte[] s) { this.postbackSecretEnc = s; touch(); }
    public boolean isActive() { return active; }
    public void setActive(boolean a) { this.active = a; touch(); }
    public String getConfigJson() { return configJson; }
    public void setConfigJson(String c) { this.configJson = c == null ? "{}" : c; touch(); }
}
