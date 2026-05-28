package com.clipupp.categories.domain;

import com.clipupp.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "category")
public class Category extends AuditableEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "slug", nullable = false, length = 120, unique = true)
    private String slug;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "icon", length = 60)
    private String icon;

    @Column(name = "description")
    private String description;

    @Column(name = "position", nullable = false)
    private short position;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "is_featured", nullable = false)
    private boolean featured = false;

    @Column(name = "featured_position")
    private Integer featuredPosition;

    @Column(name = "meta_title", length = 70)
    private String metaTitle;

    @Column(name = "meta_description", length = 170)
    private String metaDescription;

    protected Category() {}

    public static Category create(String slug, String title, UUID parentId) {
        Category c = new Category();
        c.id = UUID.randomUUID();
        c.slug = slug;
        c.title = title;
        c.parentId = parentId;
        return c;
    }

    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public UUID getParentId() { return parentId; }
    public void setParentId(UUID parentId) { this.parentId = parentId; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getDescription() { return description; }
    public void setDescription(String d) { this.description = d; }
    public short getPosition() { return position; }
    public void setPosition(short position) { this.position = position; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }
    public Integer getFeaturedPosition() { return featuredPosition; }
    public void setFeaturedPosition(Integer p) { this.featuredPosition = p; }
    public String getMetaTitle() { return metaTitle; }
    public void setMetaTitle(String mt) { this.metaTitle = mt; }
    public String getMetaDescription() { return metaDescription; }
    public void setMetaDescription(String md) { this.metaDescription = md; }
}
