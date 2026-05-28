package com.clipupp.common.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application-side helper for enqueueing outbox events. Always called inside
 * the originating business transaction so the row is written atomically with
 * the user-visible state change. The {@link OutboxPoller} drains the queue
 * out-of-band.
 */
@Service
public class OutboxService {

    private final OutboxRepository repo;
    private final ObjectMapper json;

    public OutboxService(OutboxRepository repo, ObjectMapper json) {
        this.repo = repo;
        this.json = json;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void enqueue(String topic, Object payload) {
        try {
            String body = json.writeValueAsString(payload);
            repo.save(new OutboxEntry(topic, body));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Cannot serialize outbox payload for topic " + topic, ex);
        }
    }
}
