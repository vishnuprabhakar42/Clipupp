package com.clipupp.stores.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "stats")
public class Stats {

    @Id
    @Column(name = "store_id", nullable = false, updatable = false)
    private UUID storeId;

    @Column(name = "total_offers", nullable = false)
    private int totalOffers;

    @Column(name = "coupon_codes", nullable = false)
    private int couponCodes;

    @Column(name = "in_store_coupons", nullable = false)
    private int inStoreCoupons;

    @Column(name = "free_shipping_deals", nullable = false)
    private int freeShippingDeals;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected Stats() {}

    public Stats(UUID storeId) {
        this.storeId = storeId;
    }

    public void touch() { this.updatedAt = OffsetDateTime.now(); }

    public UUID getStoreId() { return storeId; }
    public int getTotalOffers() { return totalOffers; }
    public void setTotalOffers(int v) { this.totalOffers = v; }
    public int getCouponCodes() { return couponCodes; }
    public void setCouponCodes(int v) { this.couponCodes = v; }
    public int getInStoreCoupons() { return inStoreCoupons; }
    public void setInStoreCoupons(int v) { this.inStoreCoupons = v; }
    public int getFreeShippingDeals() { return freeShippingDeals; }
    public void setFreeShippingDeals(int v) { this.freeShippingDeals = v; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
