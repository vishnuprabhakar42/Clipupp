package com.couponvalley.stores.infra;

import com.couponvalley.stores.domain.Faq;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FaqRepository extends JpaRepository<Faq, UUID> {
    List<Faq> findByStoreIdOrderByPositionAsc(UUID storeId);
    void deleteByStoreId(UUID storeId);
}
