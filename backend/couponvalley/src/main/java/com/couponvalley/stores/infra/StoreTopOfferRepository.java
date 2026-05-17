package com.couponvalley.stores.infra;

import com.couponvalley.stores.domain.StoreTopOffer;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreTopOfferRepository extends JpaRepository<StoreTopOffer, StoreTopOffer.Pk> {

    @Query("select o from StoreTopOffer o where o.id.storeId = :storeId order by o.id.position asc")
    List<StoreTopOffer> findByStoreId(@Param("storeId") UUID storeId);

    @Query("delete from StoreTopOffer o where o.id.storeId = :storeId")
    @org.springframework.data.jpa.repository.Modifying
    void deleteByStoreId(@Param("storeId") UUID storeId);
}
