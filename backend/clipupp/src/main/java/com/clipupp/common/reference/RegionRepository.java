package com.clipupp.common.reference;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegionRepository extends JpaRepository<Region, String> {
    List<Region> findByActiveTrueOrderByNameAsc();
}
