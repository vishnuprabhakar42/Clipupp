package com.couponvalley.stores.infra;

import com.couponvalley.stores.domain.FeaturedArticle;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeaturedArticleRepository extends JpaRepository<FeaturedArticle, UUID> {
    List<FeaturedArticle> findByStoreIdOrderByPositionAsc(UUID storeId);
    void deleteByStoreId(UUID storeId);
}
