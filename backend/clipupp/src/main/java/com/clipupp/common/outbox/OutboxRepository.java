package com.clipupp.common.outbox;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
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

    /**
     * Locks one ready row for this transaction. Another instance (or thread)
     * holding the row gets an empty result instead of blocking, so two
     * backends can poll the same table without dispatching twice.
     */
    @Query(value = "select * from outbox where id = :id and processed_at is null for update skip locked",
           nativeQuery = true)
    Optional<OutboxEntry> claimForDispatch(@Param("id") Long id);
}
