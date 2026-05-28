package com.clipupp.common.outbox;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OutboxRepository extends JpaRepository<OutboxEntry, Long> {

    @Query("select o from OutboxEntry o " +
           "where o.processedAt is null and o.nextAttemptAt <= :now " +
           "order by o.nextAttemptAt asc")
    List<OutboxEntry> findReadyForDispatch(@Param("now") OffsetDateTime now, Pageable pageable);
}
