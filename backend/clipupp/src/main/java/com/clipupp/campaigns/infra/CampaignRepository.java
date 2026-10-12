package com.clipupp.campaigns.infra;

import com.clipupp.campaigns.domain.Campaign;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, UUID> {

    boolean existsBySlug(String slug);

    @Query("select c from Campaign c order by c.startsAt desc")
    List<Campaign> findAllOrdered();

    @Query("""
           select c from Campaign c
           where c.active = true
             and c.startsAt <= :now
             and c.endsAt > :now
           order by c.startsAt desc
           """)
    Optional<Campaign> findActiveAt(@Param("now") OffsetDateTime now);

    @Query("""
           select c from Campaign c
           where c.active = true
             and c.startsAt <= :now
             and c.endsAt > :now
           order by c.startsAt desc
           """)
    List<Campaign> findActiveAt(@Param("now") OffsetDateTime now, Pageable pageable);
}
