package com.clipupp.common.outbox;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Drains the {@code outbox} table every 5 seconds, dispatching each entry to
 * the registered {@link OutboxDispatcher} for its topic. Failed dispatches are
 * rescheduled with capped exponential backoff (max 30 minutes).
 *
 * <p>Self-injection: {@code drain()} calls {@code processOne()} via the
 * Spring-managed proxy ({@code self}). A direct {@code this.processOne(id)}
 * call would bypass the {@code @Transactional} proxy and leave
 * {@code markProcessed()} uncommitted — the entry would be re-dispatched on
 * every tick. (This was a real bug discovered in dev — log was flooded with
 * the same email every 5 s because tx commit never happened.)
 */
@Component
public class OutboxPoller {

    private static final Logger log = LoggerFactory.getLogger(OutboxPoller.class);
    private static final int BATCH = 50;
    private static final Duration MAX_BACKOFF = Duration.ofMinutes(30);

    private final OutboxRepository repo;
    private final Map<String, OutboxDispatcher> byTopic;
    private OutboxPoller self;

    public OutboxPoller(OutboxRepository repo, List<OutboxDispatcher> dispatchers) {
        this.repo = repo;
        Map<String, OutboxDispatcher> idx = new HashMap<>();
        for (OutboxDispatcher d : dispatchers) {
            if (idx.put(d.topic(), d) != null) {
                log.warn("Multiple OutboxDispatcher beans for topic '{}'; last one wins", d.topic());
            }
        }
        this.byTopic = Map.copyOf(idx);
        log.info("OutboxPoller registered topics: {}", byTopic.keySet());
    }

    @Autowired
    public void setSelf(@Lazy OutboxPoller self) {
        this.self = self;
    }

    @Scheduled(fixedDelayString = "${clipupp.outbox.poll-ms:5000}")
    public void drain() {
        OffsetDateTime now = OffsetDateTime.now();
        List<OutboxEntry> ready = repo.findReadyForDispatch(now, PageRequest.of(0, BATCH));
        for (OutboxEntry e : ready) {
            self.processOne(e.getId());
        }
    }

    @Transactional
    public void processOne(Long id) {
        OutboxEntry e = repo.findById(id).orElse(null);
        if (e == null || e.getProcessedAt() != null) return;

        OutboxDispatcher d = byTopic.get(e.getTopic());
        if (d == null) {
            log.error("No dispatcher for outbox topic {}; id={} parking entry for 5min", e.getTopic(), e.getId());
            e.markFailed("no dispatcher", OffsetDateTime.now().plusMinutes(5));
            return;
        }

        try {
            d.dispatch(e.getPayload());
            e.markProcessed();
        } catch (Exception ex) {
            Duration backoff = computeBackoff(e.getAttempts() + 1);
            log.warn("Outbox dispatch failed topic={} id={} attempts={} backoff={}: {}",
                    e.getTopic(), e.getId(), e.getAttempts() + 1, backoff, ex.toString());
            e.markFailed(truncate(ex.toString()), OffsetDateTime.now().plus(backoff));
        }
    }

    private static Duration computeBackoff(int attempts) {
        long secs = (long) Math.pow(2, Math.min(attempts, 11));   // 2,4,8,...,2048
        Duration d = Duration.ofSeconds(secs);
        return d.compareTo(MAX_BACKOFF) > 0 ? MAX_BACKOFF : d;
    }

    private static String truncate(String s) {
        if (s == null) return null;
        return s.length() > 1000 ? s.substring(0, 1000) : s;
    }
}
