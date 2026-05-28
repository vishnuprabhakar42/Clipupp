package com.clipupp.home.infra;

import com.clipupp.home.domain.HomepageSection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface HomepageSectionRepository extends JpaRepository<HomepageSection, UUID> {

    @Query("select s from HomepageSection s order by s.position asc")
    List<HomepageSection> findAllOrdered();

    @Query("select s from HomepageSection s where s.enabled = true order by s.position asc")
    List<HomepageSection> findEnabledOrdered();

    Optional<HomepageSection> findByCode(String code);
}
