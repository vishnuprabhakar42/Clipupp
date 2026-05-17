package com.couponvalley.clicktrack.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "click")
public class Click {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    /** Public sub_id we hand to the affiliate network in the clickout URL. */
    @Column(name = "click_id", nullable = false, unique = true)
    private UUID clickId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "coupon_id", nullable = false)
    private UUID couponId;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "network_id")
    private UUID networkId;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 40)
    private ClickSource source = ClickSource.WEB;

    @Column(name = "ip_inet", columnDefinition = "inet")
    private String ipInet;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "referer")
    private String referer;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Column(name = "outbound_url", nullable = false)
    private String outboundUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    protected Click() {}

    public static Click record(UUID clickId, UUID couponId, UUID storeId, UUID networkId,
                               UUID userId, ClickSource source, String ip, String userAgent,
                               String referer, String countryCode, String outboundUrl) {
        Click c = new Click();
        c.id = UUID.randomUUID();
        c.clickId = clickId;
        c.couponId = couponId;
        c.storeId = storeId;
        c.networkId = networkId;
        c.userId = userId;
        c.source = source == null ? ClickSource.WEB : source;
        c.ipInet = ip;
        c.userAgent = userAgent;
        c.referer = referer;
        c.countryCode = countryCode;
        c.outboundUrl = outboundUrl;
        return c;
    }

    public UUID getId() { return id; }
    public UUID getClickId() { return clickId; }
    public UUID getUserId() { return userId; }
    public UUID getCouponId() { return couponId; }
    public UUID getStoreId() { return storeId; }
    public UUID getNetworkId() { return networkId; }
    public ClickSource getSource() { return source; }
    public String getIpInet() { return ipInet; }
    public String getUserAgent() { return userAgent; }
    public String getReferer() { return referer; }
    public String getCountryCode() { return countryCode; }
    public String getOutboundUrl() { return outboundUrl; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
