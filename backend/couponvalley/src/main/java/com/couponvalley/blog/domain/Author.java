package com.couponvalley.blog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "author")
public class Author {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "slug", nullable = false, length = 120, unique = true)
    private String slug;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "bio")
    private String bio;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected Author() {}

    public static Author create(String slug, String name) {
        Author a = new Author();
        a.id = UUID.randomUUID();
        a.slug = slug;
        a.name = name;
        return a;
    }

    public void touch() { this.updatedAt = OffsetDateTime.now(); }

    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public void setSlug(String s) { this.slug = s; touch(); }
    public String getName() { return name; }
    public void setName(String n) { this.name = n; touch(); }
    public String getBio() { return bio; }
    public void setBio(String b) { this.bio = b; touch(); }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String a) { this.avatarUrl = a; touch(); }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
