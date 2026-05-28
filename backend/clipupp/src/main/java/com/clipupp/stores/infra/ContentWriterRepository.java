package com.clipupp.stores.infra;

import com.clipupp.stores.domain.ContentWriter;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContentWriterRepository extends JpaRepository<ContentWriter, UUID> {
}
