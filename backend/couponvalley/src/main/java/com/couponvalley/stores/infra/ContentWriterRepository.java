package com.couponvalley.stores.infra;

import com.couponvalley.stores.domain.ContentWriter;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContentWriterRepository extends JpaRepository<ContentWriter, UUID> {
}
