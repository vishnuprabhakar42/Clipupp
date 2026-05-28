package com.clipupp.common.outbox;

/**
 * Topic-keyed handler. Implementations are discovered as Spring beans by
 * {@link OutboxPoller}. The dispatch contract: parse {@code payload} as the
 * topic-specific JSON shape, side-effect, and return on success. Throw to
 * trigger a retry (with exponential backoff applied by the poller).
 */
public interface OutboxDispatcher {
    String topic();
    void dispatch(String payload) throws Exception;
}
