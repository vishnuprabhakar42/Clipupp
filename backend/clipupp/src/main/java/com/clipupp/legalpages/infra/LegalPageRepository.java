package com.clipupp.legalpages.infra;

import com.clipupp.legalpages.domain.LegalPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LegalPageRepository extends JpaRepository<LegalPage, String> {}
