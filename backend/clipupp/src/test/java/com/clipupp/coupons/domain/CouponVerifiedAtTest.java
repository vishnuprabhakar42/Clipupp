package com.clipupp.coupons.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class CouponVerifiedAtTest {

    private static final OffsetDateTime T1 = OffsetDateTime.of(2026, 10, 12, 9, 0, 0, 0, ZoneOffset.UTC);
    private static final OffsetDateTime T2 = T1.plusHours(3);

    @Test
    void verifyingStampsTimestamp() {
        Coupon c = new Coupon();
        c.applyVerified(true, T1);
        assertThat(c.isVerified()).isTrue();
        assertThat(c.getVerifiedAt()).isEqualTo(T1);
    }

    @Test
    void reVerifyingAlreadyVerifiedCouponRefreshesTimestamp() {
        Coupon c = new Coupon();
        c.applyVerified(true, T1);
        c.applyVerified(true, T2);
        assertThat(c.getVerifiedAt()).isEqualTo(T2);
    }

    @Test
    void unverifyingClearsTimestamp() {
        Coupon c = new Coupon();
        c.applyVerified(true, T1);
        c.applyVerified(false, T2);
        assertThat(c.isVerified()).isFalse();
        assertThat(c.getVerifiedAt()).isNull();
    }
}
