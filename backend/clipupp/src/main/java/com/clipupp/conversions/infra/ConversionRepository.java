package com.clipupp.conversions.infra;

import com.clipupp.conversions.domain.Conversion;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConversionRepository extends JpaRepository<Conversion, UUID> {
    Optional<Conversion> findByNetworkIdAndNetworkTxnId(UUID networkId, String networkTxnId);
}
