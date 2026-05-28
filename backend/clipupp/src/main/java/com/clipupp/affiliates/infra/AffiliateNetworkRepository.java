package com.clipupp.affiliates.infra;

import com.clipupp.affiliates.domain.AffiliateNetwork;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AffiliateNetworkRepository extends JpaRepository<AffiliateNetwork, UUID> {
    Optional<AffiliateNetwork> findByCode(String code);
    boolean existsByCode(String code);
}
