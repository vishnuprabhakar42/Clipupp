package com.couponvalley.affiliates.infra;

import com.couponvalley.affiliates.domain.MerchantNetworkLink;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MerchantNetworkLinkRepository extends JpaRepository<MerchantNetworkLink, UUID> {

    @Query("""
           select l from MerchantNetworkLink l
           where l.storeId = :storeId and l.active = true
           order by l.priority desc, l.createdAt asc
           """)
    Optional<MerchantNetworkLink> findActiveByStore(@Param("storeId") UUID storeId);

    List<MerchantNetworkLink> findByStoreIdOrderByPriorityDesc(UUID storeId);
}
