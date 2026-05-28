package com.clipupp.settings.infra;

import com.clipupp.settings.domain.SiteSetting;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface SiteSettingRepository extends JpaRepository<SiteSetting, String> {

    @Query("select s from SiteSetting s order by s.key asc")
    List<SiteSetting> findAllOrdered();

    List<SiteSetting> findByKeyIn(List<String> keys);
}
