package com.couponvalley.clicktrack.application;

import com.couponvalley.affiliates.domain.AffiliateNetwork;
import com.couponvalley.affiliates.domain.MerchantNetworkLink;
import com.couponvalley.affiliates.infra.AffiliateNetworkRepository;
import com.couponvalley.affiliates.infra.MerchantNetworkLinkRepository;
import com.couponvalley.coupons.domain.Coupon;
import com.couponvalley.coupons.domain.CouponStatus;
import com.couponvalley.coupons.infra.CouponRepository;
import com.couponvalley.stores.domain.Store;
import com.couponvalley.stores.infra.StoreRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Caffeine-backed lookup that walks coupon → store → active network link in
 * a single read. Cache key is the coupon UUID. Eviction happens via
 * AdminCoupons / AdminStores write paths (already declared {@code allEntries}
 * on the {@code coupon.redirect} cache).
 */
@Component
public class ClickRedirectCache {

    private final CouponRepository couponRepo;
    private final StoreRepository storeRepo;
    private final MerchantNetworkLinkRepository linkRepo;
    private final AffiliateNetworkRepository networkRepo;

    public ClickRedirectCache(CouponRepository couponRepo, StoreRepository storeRepo,
                              MerchantNetworkLinkRepository linkRepo,
                              AffiliateNetworkRepository networkRepo) {
        this.couponRepo = couponRepo;
        this.storeRepo = storeRepo;
        this.linkRepo = linkRepo;
        this.networkRepo = networkRepo;
    }

    @Cacheable(cacheNames = "coupon.redirect", key = "#couponId", unless = "#result == null")
    @Transactional(readOnly = true)
    public CouponRedirectInfo lookup(UUID couponId) {
        Coupon coupon = couponRepo.findById(couponId).orElse(null);
        if (coupon == null || coupon.getStatus() != CouponStatus.ACTIVE || coupon.getDeletedAt() != null) {
            return null;
        }
        Store store = storeRepo.findById(coupon.getStoreId()).orElse(null);
        if (store == null) return null;

        Optional<MerchantNetworkLink> link = linkRepo.findActiveByStore(store.getId());
        UUID networkId = null;
        String networkCode = null;
        String advertiserId = null;
        String template = null;
        if (link.isPresent()) {
            MerchantNetworkLink l = link.get();
            networkId = l.getNetworkId();
            advertiserId = l.getAdvertiserId();
            template = l.getDeeplinkTemplate();
            AffiliateNetwork network = networkRepo.findById(l.getNetworkId()).orElse(null);
            if (network != null) networkCode = network.getCode();
        }

        String merchantUrl = coupon.getAffiliateUrlOverride() != null
                && !coupon.getAffiliateUrlOverride().isBlank()
                ? coupon.getAffiliateUrlOverride()
                : store.getPrimaryUrl();

        return new CouponRedirectInfo(coupon.getId(), store.getId(), store.getName(),
                networkId, networkCode, advertiserId, template, merchantUrl);
    }
}
