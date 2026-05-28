package com.clipupp.conversions.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "conversion")
public class Conversion {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "click_id")
    private UUID clickId;

    @Column(name = "network_id", nullable = false)
    private UUID networkId;

    @Column(name = "network_txn_id", nullable = false, length = 200)
    private String networkTxnId;

    @Enumerated(EnumType.STRING)
    @Column(name = "state", nullable = false, length = 20)
    private ConversionState state = ConversionState.PENDING;

    @Column(name = "order_amount", precision = 19, scale = 4)
    private BigDecimal orderAmount;

    @Column(name = "order_currency", length = 3)
    private String orderCurrency;

    @Column(name = "commission_amount", precision = 19, scale = 4)
    private BigDecimal commissionAmount;

    @Column(name = "commission_currency", length = 3)
    private String commissionCurrency;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_payload", nullable = false, columnDefinition = "jsonb")
    private String rawPayload;

    @Column(name = "reported_at")
    private OffsetDateTime reportedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected Conversion() {}

    public static Conversion create(UUID networkId, String networkTxnId, UUID clickId,
                                    BigDecimal orderAmount, String orderCurrency,
                                    BigDecimal commissionAmount, String commissionCurrency,
                                    String rawPayload, OffsetDateTime reportedAt) {
        Conversion c = new Conversion();
        c.id = UUID.randomUUID();
        c.networkId = networkId;
        c.networkTxnId = networkTxnId;
        c.clickId = clickId;
        c.orderAmount = orderAmount;
        c.orderCurrency = orderCurrency;
        c.commissionAmount = commissionAmount;
        c.commissionCurrency = commissionCurrency;
        c.rawPayload = rawPayload == null ? "{}" : rawPayload;
        c.reportedAt = reportedAt;
        return c;
    }

    public void transition(ConversionState next) {
        this.state = next;
        this.updatedAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public UUID getClickId() { return clickId; }
    public UUID getNetworkId() { return networkId; }
    public String getNetworkTxnId() { return networkTxnId; }
    public ConversionState getState() { return state; }
    public BigDecimal getOrderAmount() { return orderAmount; }
    public String getOrderCurrency() { return orderCurrency; }
    public BigDecimal getCommissionAmount() { return commissionAmount; }
    public String getCommissionCurrency() { return commissionCurrency; }
    public String getRawPayload() { return rawPayload; }
    public OffsetDateTime getReportedAt() { return reportedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
