package com.couponvalley.affiliates.application;

import com.couponvalley.affiliates.domain.AffiliateNetwork;
import com.couponvalley.affiliates.domain.MerchantNetworkLink;
import com.couponvalley.affiliates.infra.AffiliateNetworkRepository;
import com.couponvalley.affiliates.infra.MerchantNetworkLinkRepository;
import com.couponvalley.common.audit.AuditLogService;
import com.couponvalley.common.error.ApiException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AffiliateAdminService {

    private final AffiliateNetworkRepository networkRepo;
    private final MerchantNetworkLinkRepository linkRepo;
    private final NetworkAdapterRegistry adapterRegistry;
    private final AuditLogService audit;

    public AffiliateAdminService(AffiliateNetworkRepository networkRepo,
                                 MerchantNetworkLinkRepository linkRepo,
                                 NetworkAdapterRegistry adapterRegistry,
                                 AuditLogService audit) {
        this.networkRepo = networkRepo;
        this.linkRepo = linkRepo;
        this.adapterRegistry = adapterRegistry;
        this.audit = audit;
    }

    // ---- Networks ----------------------------------------------------------

    @Transactional
    public AffiliateNetwork createNetwork(String code, String name, String postbackSecret,
                                          Boolean active, String configJson) {
        if (networkRepo.existsByCode(code)) {
            throw ApiException.conflict("Network code already in use");
        }
        if (adapterRegistry.find(code).isEmpty()) {
            throw ApiException.notFound("No adapter registered for network code '" + code
                    + "'. Add a NetworkAdapter implementation first.");
        }
        AffiliateNetwork n = AffiliateNetwork.create(code, name);
        if (active != null) n.setActive(active);
        if (configJson != null) n.setConfigJson(configJson);
        if (postbackSecret != null && !postbackSecret.isBlank()) {
            n.setPostbackSecretEnc(postbackSecret.getBytes(StandardCharsets.UTF_8));
        }
        AffiliateNetwork saved = networkRepo.save(n);
        audit.record("AFFILIATE_NETWORK_CREATE", "affiliate_network", saved.getId(),
                Map.of("code", code));
        return saved;
    }

    @Transactional
    public AffiliateNetwork updateNetwork(UUID id, String name, String postbackSecret,
                                          Boolean active, String configJson) {
        AffiliateNetwork n = networkRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("Network not found"));
        if (name != null) n.setName(name);
        if (active != null) n.setActive(active);
        if (configJson != null) n.setConfigJson(configJson);
        if (postbackSecret != null && !postbackSecret.isBlank()) {
            n.setPostbackSecretEnc(postbackSecret.getBytes(StandardCharsets.UTF_8));
        }
        audit.record("AFFILIATE_NETWORK_UPDATE", "affiliate_network", n.getId(),
                Map.of("code", n.getCode()));
        return n;
    }

    @Transactional(readOnly = true)
    public List<AffiliateNetwork> listNetworks() {
        return networkRepo.findAll();
    }

    @Transactional(readOnly = true)
    public AffiliateNetwork requireNetwork(UUID id) {
        return networkRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("Network not found"));
    }

    // ---- Merchant network links --------------------------------------------

    @CacheEvict(cacheNames = "coupon.redirect", allEntries = true)
    @Transactional
    public MerchantNetworkLink createLink(UUID storeId, UUID networkId, String advertiserId,
                                          String deeplinkTemplate, Short priority, Boolean active) {
        if (!networkRepo.existsById(networkId)) {
            throw ApiException.notFound("Network not found");
        }
        MerchantNetworkLink l = MerchantNetworkLink.create(storeId, networkId, advertiserId,
                deeplinkTemplate, priority == null ? 0 : priority);
        if (active != null) l.setActive(active);
        MerchantNetworkLink saved = linkRepo.save(l);
        audit.record("MERCHANT_NETWORK_LINK_CREATE", "merchant_network_link", saved.getId(),
                Map.of("storeId", storeId.toString(), "networkId", networkId.toString()));
        return saved;
    }

    @CacheEvict(cacheNames = "coupon.redirect", allEntries = true)
    @Transactional
    public MerchantNetworkLink updateLink(UUID id, String advertiserId, String deeplinkTemplate,
                                          Short priority, Boolean active) {
        MerchantNetworkLink l = linkRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("Link not found"));
        if (advertiserId != null) l.setAdvertiserId(advertiserId);
        if (deeplinkTemplate != null) l.setDeeplinkTemplate(deeplinkTemplate);
        if (priority != null) l.setPriority(priority);
        if (active != null) l.setActive(active);
        audit.record("MERCHANT_NETWORK_LINK_UPDATE", "merchant_network_link", l.getId(),
                Map.of("storeId", l.getStoreId().toString()));
        return l;
    }

    @CacheEvict(cacheNames = "coupon.redirect", allEntries = true)
    @Transactional
    public void deleteLink(UUID id) {
        MerchantNetworkLink l = linkRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("Link not found"));
        linkRepo.delete(l);
        audit.record("MERCHANT_NETWORK_LINK_DELETE", "merchant_network_link", id,
                Map.of("storeId", l.getStoreId().toString()));
    }

    @Transactional(readOnly = true)
    public List<MerchantNetworkLink> listLinksForStore(UUID storeId) {
        return linkRepo.findByStoreIdOrderByPriorityDesc(storeId);
    }

    @Transactional(readOnly = true)
    public MerchantNetworkLink findLink(UUID id) {
        return linkRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound("Link not found"));
    }
}
