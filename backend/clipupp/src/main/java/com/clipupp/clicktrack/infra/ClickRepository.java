package com.clipupp.clicktrack.infra;

import com.clipupp.clicktrack.domain.Click;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClickRepository extends JpaRepository<Click, UUID> {
    Page<Click> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
