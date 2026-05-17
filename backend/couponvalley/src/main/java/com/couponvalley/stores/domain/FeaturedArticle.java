package com.couponvalley.stores.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "featured_article")
public class FeaturedArticle {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "position", nullable = false)
    private short position;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "url")
    private String url;

    @Column(name = "author", length = 200)
    private String author;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected FeaturedArticle() {}

    public static FeaturedArticle create(UUID storeId, short position, String title, String description) {
        FeaturedArticle a = new FeaturedArticle();
        a.id = UUID.randomUUID();
        a.storeId = storeId;
        a.position = position;
        a.title = title;
        a.description = description;
        return a;
    }

    public UUID getId() { return id; }
    public UUID getStoreId() { return storeId; }
    public short getPosition() { return position; }
    public void setPosition(short p) { this.position = p; }
    public String getTitle() { return title; }
    public void setTitle(String t) { this.title = t; this.updatedAt = OffsetDateTime.now(); }
    public String getDescription() { return description; }
    public void setDescription(String d) { this.description = d; this.updatedAt = OffsetDateTime.now(); }
    public String getUrl() { return url; }
    public void setUrl(String u) { this.url = u; }
    public String getAuthor() { return author; }
    public void setAuthor(String a) { this.author = a; }
}
