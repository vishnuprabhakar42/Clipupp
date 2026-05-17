package com.couponvalley.savedcoupons.application;

import com.couponvalley.common.error.ApiException;
import com.couponvalley.common.pagination.CursorEncoder;
import com.couponvalley.common.pagination.CursorPage;
import com.couponvalley.coupons.domain.Coupon;
import com.couponvalley.coupons.domain.CouponStatus;
import com.couponvalley.coupons.infra.CouponRepository;
import com.couponvalley.savedcoupons.domain.SavedCoupon;
import com.couponvalley.savedcoupons.infra.SavedCouponRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages each user's saved-coupon list. Save is idempotent (DUP-PK silently
 * succeeds), unsave is best-effort (404 only on missing user, not missing
 * pair — easier UX for stale optimistic-UI updates).
 */
@Service
public class SavedCouponService {

    public static final int LIST_DEFAULT_LIMIT = 24;

    private final SavedCouponRepository savedRepo;
    private final CouponRepository couponRepo;

    public SavedCouponService(SavedCouponRepository savedRepo, CouponRepository couponRepo) {
        this.savedRepo = savedRepo;
        this.couponRepo = couponRepo;
    }

    @Transactional
    public boolean save(UUID userId, UUID couponId) {
        // Validate the coupon exists and isn't deleted before persisting the link.
        Coupon coupon = couponRepo.findById(couponId)
                .filter(c -> c.getDeletedAt() == null)
                .filter(c -> c.getStatus() != CouponStatus.DELETED)
                .orElseThrow(() -> ApiException.notFound("Coupon not found"));

        SavedCoupon.Pk key = new SavedCoupon.Pk(userId, coupon.getId());
        if (savedRepo.existsById(key)) {
            return false;  // already saved — idempotent no-op
        }
        savedRepo.save(new SavedCoupon(userId, coupon.getId()));
        return true;
    }

    @Transactional
    public boolean unsave(UUID userId, UUID couponId) {
        return savedRepo.deleteByUserAndCoupon(userId, couponId) > 0;
    }

    @Transactional(readOnly = true)
    public CursorPage<SavedItem> list(UUID userId, String cursor, Integer limit) {
        int size = limit == null ? LIST_DEFAULT_LIMIT : Math.max(1, Math.min(limit, 100));
        int page = CursorEncoder.decodePageOr(cursor, 0);
        Page<SavedCoupon> result = savedRepo.findByUser(userId, PageRequest.of(page, size));

        // Single roundtrip to fetch the underlying coupons in the page.
        List<UUID> couponIds = result.getContent().stream().map(SavedCoupon::getCouponId).toList();
        Map<UUID, Coupon> byId = new HashMap<>();
        for (Coupon c : couponRepo.findAllById(couponIds)) byId.put(c.getId(), c);

        return CursorPage.from(result, s -> {
            Coupon c = byId.get(s.getCouponId());
            return new SavedItem(
                    s.getCouponId(),
                    s.getSavedAt().toString(),
                    c == null ? null : c.getSlug(),
                    c == null ? null : c.getTitle(),
                    c == null ? null : c.getSavingsLabel(),
                    c == null ? null : c.getStatus().name(),
                    c == null ? null : c.getStoreId());
        });
    }

    public record SavedItem(UUID couponId, String savedAt, String couponSlug,
                            String couponTitle, String savingsLabel, String couponStatus,
                            UUID storeId) {}
}
