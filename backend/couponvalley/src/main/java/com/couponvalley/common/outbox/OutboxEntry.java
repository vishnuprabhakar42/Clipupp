package com.couponvalley.common.outbox;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "outbox")
public class OutboxEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "topic", nullable = false, length = 60)
    private String topic;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    private String payload;

    @Column(name = "attempts", nullable = false)
    private short attempts;

    @Column(name = "next_attempt_at", nullable = false)
    private OffsetDateTime nextAttemptAt = OffsetDateTime.now();

    @Column(name = "processed_at")
    private OffsetDateTime processedAt;

    @Column(name = "last_error")
    private String lastError;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    protected OutboxEntry() {}

    public OutboxEntry(String topic, String payload) {
        this.topic = topic;
        this.payload = payload;
    }

    public void markProcessed() {
        this.processedAt = OffsetDateTime.now();
        this.lastError = null;
    }

    public void markFailed(String error, OffsetDateTime nextAttempt) {
        this.attempts = (short) (this.attempts + 1);
        this.lastError = error;
        this.nextAttemptAt = nextAttempt;
    }

    public Long getId() { return id; }
    public String getTopic() { return topic; }
    public String getPayload() { return payload; }
    public short getAttempts() { return attempts; }
    public OffsetDateTime getNextAttemptAt() { return nextAttemptAt; }
    public OffsetDateTime getProcessedAt() { return processedAt; }
    public String getLastError() { return lastError; }
}
