package com.couponvalley.blog.domain;

import com.couponvalley.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "article")
public class Article extends AuditableEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "slug", nullable = false, length = 180, unique = true)
    private String slug;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "excerpt", nullable = false, length = 500)
    private String excerpt;

    @Column(name = "body_md", nullable = false)
    private String bodyMd;

    @Column(name = "hero_image_url")
    private String heroImageUrl;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ArticleStatus status = ArticleStatus.DRAFT;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @Column(name = "scheduled_for")
    private OffsetDateTime scheduledFor;

    @Column(name = "meta_title", length = 70)
    private String metaTitle;

    @Column(name = "meta_description", length = 170)
    private String metaDescription;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    protected Article() {}

    public static Article create(String slug, String title, String excerpt, String bodyMd, UUID authorId) {
        Article a = new Article();
        a.id = UUID.randomUUID();
        a.slug = slug;
        a.title = title;
        a.excerpt = excerpt;
        a.bodyMd = bodyMd;
        a.authorId = authorId;
        return a;
    }

    public void publishNow() {
        this.status = ArticleStatus.PUBLISHED;
        this.publishedAt = OffsetDateTime.now();
        this.scheduledFor = null;
    }

    public void scheduleFor(OffsetDateTime when) {
        this.status = ArticleStatus.SCHEDULED;
        this.scheduledFor = when;
    }

    public void hide() {
        this.status = ArticleStatus.HIDDEN;
    }

    public void softDelete() {
        this.status = ArticleStatus.HIDDEN;
        this.deletedAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public void setSlug(String s) { this.slug = s; }
    public String getTitle() { return title; }
    public void setTitle(String t) { this.title = t; }
    public String getExcerpt() { return excerpt; }
    public void setExcerpt(String e) { this.excerpt = e; }
    public String getBodyMd() { return bodyMd; }
    public void setBodyMd(String b) { this.bodyMd = b; }
    public String getHeroImageUrl() { return heroImageUrl; }
    public void setHeroImageUrl(String h) { this.heroImageUrl = h; }
    public UUID getAuthorId() { return authorId; }
    public void setAuthorId(UUID a) { this.authorId = a; }
    public ArticleStatus getStatus() { return status; }
    public void setStatus(ArticleStatus s) { this.status = s; }
    public OffsetDateTime getPublishedAt() { return publishedAt; }
    public OffsetDateTime getScheduledFor() { return scheduledFor; }
    public String getMetaTitle() { return metaTitle; }
    public void setMetaTitle(String m) { this.metaTitle = m; }
    public String getMetaDescription() { return metaDescription; }
    public void setMetaDescription(String m) { this.metaDescription = m; }
    public OffsetDateTime getDeletedAt() { return deletedAt; }
}
