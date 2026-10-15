package com.clipupp.coupons.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.clipupp.categories.infra.CategoryRepository;
import com.clipupp.common.audit.AuditLogService;
import com.clipupp.coupons.application.CouponService.BulkAction;
import com.clipupp.coupons.application.CouponService.BulkResult;
import com.clipupp.coupons.application.CouponService.UpdateCouponCommand;
import com.clipupp.coupons.domain.Coupon;
import com.clipupp.coupons.domain.CouponType;
import com.clipupp.coupons.infra.CouponRepository;
import com.clipupp.stores.infra.StoreRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Service-level rule for the "Verified ..." stamp shown on cards:
 * an ordinary edit never re-stamps, the bulk VERIFY action always does.
 */
class CouponServiceVerifiedAtTest {

    private static final OffsetDateTime LAST_WEEK =
            OffsetDateTime.of(2026, 10, 5, 9, 0, 0, 0, ZoneOffset.UTC);

    private final CouponRepository couponRepo = mock(CouponRepository.class);
    private final StoreRepository storeRepo = mock(StoreRepository.class);
    private final CategoryRepository categoryRepo = mock(CategoryRepository.class);
    private final AuditLogService audit = mock(AuditLogService.class);
    private CouponService service;
    private Coupon coupon;

    @BeforeEach
    void setUp() {
        service = new CouponService(couponRepo, storeRepo, categoryRepo, audit);
        coupon = Coupon.create("myntra-flat-200", UUID.randomUUID(), CouponType.CODE, "Flat 200 off", "d");
        when(couponRepo.findById(coupon.getId())).thenReturn(Optional.of(coupon));
        when(couponRepo.findAllById(List.of(coupon.getId()))).thenReturn(List.of(coupon));
    }

    private static UpdateCouponCommand update(Boolean verified, String title) {
        return new UpdateCouponCommand(null, null, null, title, null, null, null,
                null, null, null, null, null, verified, null, null, null, null, null, null);
    }

    @Test
    void updateWithVerifiedTrueOnAlreadyVerifiedCouponKeepsVerifiedAt() {
        coupon.applyVerified(true, LAST_WEEK);

        service.update(coupon.getId(), update(true, "Flat 200 off on fashion"));

        assertThat(coupon.isVerified()).isTrue();
        assertThat(coupon.getVerifiedAt()).isEqualTo(LAST_WEEK);
        assertThat(coupon.getTitle()).isEqualTo("Flat 200 off on fashion");
    }

    @Test
    void updateFlippingToVerifiedStampsNow() {
        OffsetDateTime before = OffsetDateTime.now();

        service.update(coupon.getId(), update(true, null));

        assertThat(coupon.isVerified()).isTrue();
        assertThat(coupon.getVerifiedAt()).isAfterOrEqualTo(before);
    }

    @Test
    void updateUnverifyingClearsVerifiedAt() {
        coupon.applyVerified(true, LAST_WEEK);

        service.update(coupon.getId(), update(false, null));

        assertThat(coupon.isVerified()).isFalse();
        assertThat(coupon.getVerifiedAt()).isNull();
    }

    @Test
    void bulkVerifyRefreshesVerifiedAtOnAlreadyVerifiedCoupon() {
        coupon.applyVerified(true, LAST_WEEK);
        OffsetDateTime before = OffsetDateTime.now();

        BulkResult result = service.bulk(BulkAction.VERIFY, List.of(coupon.getId()));

        assertThat(result.updated()).isEqualTo(1);
        assertThat(coupon.isVerified()).isTrue();
        assertThat(coupon.getVerifiedAt()).isAfterOrEqualTo(before);
    }

    @Test
    void bulkUnverifyClearsVerifiedAt() {
        coupon.applyVerified(true, LAST_WEEK);

        service.bulk(BulkAction.UNVERIFY, List.of(coupon.getId()));

        assertThat(coupon.isVerified()).isFalse();
        assertThat(coupon.getVerifiedAt()).isNull();
    }
}
