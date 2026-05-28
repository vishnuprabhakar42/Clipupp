package com.clipupp.savedcoupons.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "saved_coupon")
public class SavedCoupon {

    @EmbeddedId
    private Pk id;

    @Column(name = "saved_at", nullable = false, updatable = false)
    private OffsetDateTime savedAt = OffsetDateTime.now();

    protected SavedCoupon() {}

    public SavedCoupon(UUID userId, UUID couponId) {
        this.id = new Pk(userId, couponId);
    }

    public Pk getId() { return id; }
    public UUID getUserId() { return id.userId; }
    public UUID getCouponId() { return id.couponId; }
    public OffsetDateTime getSavedAt() { return savedAt; }

    @Embeddable
    public static class Pk implements Serializable {
        @Column(name = "user_id", nullable = false)
        private UUID userId;

        @Column(name = "coupon_id", nullable = false)
        private UUID couponId;

        protected Pk() {}

        public Pk(UUID userId, UUID couponId) {
            this.userId = userId;
            this.couponId = couponId;
        }

        public UUID getUserId() { return userId; }
        public UUID getCouponId() { return couponId; }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Pk pk)) return false;
            return Objects.equals(userId, pk.userId) && Objects.equals(couponId, pk.couponId);
        }
        @Override public int hashCode() { return Objects.hash(userId, couponId); }
    }
}
