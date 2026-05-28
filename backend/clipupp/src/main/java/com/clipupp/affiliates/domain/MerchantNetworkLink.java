package com.clipupp.affiliates.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Maps a Store to an AffiliateNetwork with the deeplink template used to
 * build clickout URLs. {@code priority} lets us A/B between networks for the
 * same merchant without deleting rows; the highest-priority {@code active}
 * row wins.
 */
@Entity
@Table(name = "merchant_network_link")
public class MerchantNetworkLink {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "network_id", nullable = false)
    private UUID networkId;

    @Column(name = "advertiser_id", nullable = false, length = 120)
    private String advertiserId;

    @Column(name = "deeplink_template", nullable = false)
    private String deeplinkTemplate;

    @Column(name = "priority", nullable = false)
    private short priority;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected MerchantNetworkLink() {}

    public static MerchantNetworkLink create(UUID storeId, UUID networkId, String advertiserId,
                                             String deeplinkTemplate, short priority) {
        MerchantNetworkLink l = new MerchantNetworkLink();
        l.id = UUID.randomUUID();
        l.storeId = storeId;
        l.networkId = networkId;
        l.advertiserId = advertiserId;
        l.deeplinkTemplate = deeplinkTemplate;
        l.priority = priority;
        return l;
    }

    public void touch() { this.updatedAt = OffsetDateTime.now(); }

    public UUID getId() { return id; }
    public UUID getStoreId() { return storeId; }
    public UUID getNetworkId() { return networkId; }
    public String getAdvertiserId() { return advertiserId; }
    public void setAdvertiserId(String a) { this.advertiserId = a; touch(); }
    public String getDeeplinkTemplate() { return deeplinkTemplate; }
    public void setDeeplinkTemplate(String t) { this.deeplinkTemplate = t; touch(); }
    public short getPriority() { return priority; }
    public void setPriority(short p) { this.priority = p; touch(); }
    public boolean isActive() { return active; }
    public void setActive(boolean a) { this.active = a; touch(); }
}
