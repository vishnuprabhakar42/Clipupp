package com.clipupp.stores.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "faq")
public class Faq {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "position", nullable = false)
    private short position;

    @Column(name = "question", nullable = false)
    private String question;

    @Column(name = "answer", nullable = false)
    private String answer;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected Faq() {}

    public static Faq create(UUID storeId, short position, String question, String answer) {
        Faq f = new Faq();
        f.id = UUID.randomUUID();
        f.storeId = storeId;
        f.position = position;
        f.question = question;
        f.answer = answer;
        return f;
    }

    public UUID getId() { return id; }
    public UUID getStoreId() { return storeId; }
    public short getPosition() { return position; }
    public void setPosition(short p) { this.position = p; }
    public String getQuestion() { return question; }
    public void setQuestion(String q) { this.question = q; this.updatedAt = OffsetDateTime.now(); }
    public String getAnswer() { return answer; }
    public void setAnswer(String a) { this.answer = a; this.updatedAt = OffsetDateTime.now(); }
}
