package com.clipupp.stores.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "store_top_offer")
public class StoreTopOffer {

    @EmbeddedId
    private Pk id;

    @Column(name = "text", nullable = false)
    private String text;

    protected StoreTopOffer() {}

    public StoreTopOffer(UUID storeId, short position, String text) {
        this.id = new Pk(storeId, position);
        this.text = text;
    }

    public Pk getId() { return id; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    @Embeddable
    public static class Pk implements Serializable {
        @Column(name = "store_id", nullable = false)
        private UUID storeId;

        @Column(name = "position", nullable = false)
        private short position;

        protected Pk() {}

        public Pk(UUID storeId, short position) {
            this.storeId = storeId;
            this.position = position;
        }

        public UUID getStoreId() { return storeId; }
        public short getPosition() { return position; }

        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Pk pk)) return false;
            return position == pk.position && Objects.equals(storeId, pk.storeId);
        }
        @Override public int hashCode() { return Objects.hash(storeId, position); }
    }
}
