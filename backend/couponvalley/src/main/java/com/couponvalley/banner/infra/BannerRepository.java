package com.couponvalley.banner.infra;

import com.couponvalley.banner.domain.Banner;
import com.couponvalley.banner.domain.BannerPlacement;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BannerRepository extends JpaRepository<Banner, UUID> {

    @Query("""
           select b from Banner b
           where b.active = true
             and (:placement is null or b.placement = :placement)
             and (:countryCode is null or b.countryCode is null or b.countryCode = :countryCode)
             and (b.startsAt is null or b.startsAt <= :now)
             and (b.endsAt is null or b.endsAt > :now)
           order by b.position asc, b.createdAt asc
           """)
    List<Banner> findLive(@Param("now") OffsetDateTime now,
                          @Param("countryCode") String countryCode,
                          @Param("placement") BannerPlacement placement);

    List<Banner> findAllByOrderByPositionAsc();
}
