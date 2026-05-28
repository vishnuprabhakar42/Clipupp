package com.clipupp.stores.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "content_writer")
public class ContentWriter {

    @Id
    @Column(name = "store_id", nullable = false, updatable = false)
    private UUID storeId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "role", nullable = false, length = 120)
    private String role;

    @Column(name = "bio", nullable = false)
    private String bio;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    protected ContentWriter() {}

    public ContentWriter(UUID storeId, String name, String role, String bio) {
        this.storeId = storeId;
        this.name = name;
        this.role = role;
        this.bio = bio;
    }

    public UUID getStoreId() { return storeId; }
    public String getName() { return name; }
    public void setName(String n) { this.name = n; }
    public String getRole() { return role; }
    public void setRole(String r) { this.role = r; }
    public String getBio() { return bio; }
    public void setBio(String b) { this.bio = b; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String i) { this.imageUrl = i; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void touch() { this.updatedAt = OffsetDateTime.now(); }
}
