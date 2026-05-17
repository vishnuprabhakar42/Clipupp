package com.couponvalley.legalpages.infra;

import com.couponvalley.legalpages.domain.LegalPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LegalPageRepository extends JpaRepository<LegalPage, String> {}
