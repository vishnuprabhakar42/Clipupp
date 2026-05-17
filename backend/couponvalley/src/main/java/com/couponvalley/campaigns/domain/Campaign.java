package com.couponvalley.campaigns.domain;

import com.couponvalley.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "campaign")
public class Campaign extends AuditableEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "slug", nullable = false, length = 180, unique = true)
    private String slug;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "starts_at", nullable = false)
    private OffsetDateTime startsAt;

    @Column(name = "ends_at", nullable = false)
    private OffsetDateTime endsAt;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "hero_title")
    private String heroTitle;

    @Column(name = "hero_subtitle")
    private String heroSubtitle;

    @Column(name = "hero_image_url")
    private String heroImageUrl;

    @Column(name = "cta_label")
    private String ctaLabel;

    @Column(name = "cta_url")
    private String ctaUrl;

    @Column(name = "theme_color", length = 16)
    private String themeColor;

    @Column(name = "banner_id")
    private UUID bannerId;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "pinned_store_ids", columnDefinition = "uuid[]")
    private UUID[] pinnedStoreIds = new UUID[0];

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "pinned_coupon_ids", columnDefinition = "uuid[]")
    private UUID[] pinnedCouponIds = new UUID[0];

    protected Campaign() {}

    public static Campaign create(String slug, String name,
                                  OffsetDateTime startsAt, OffsetDateTime endsAt) {
        Campaign c = new Campaign();
        c.id = UUID.randomUUID();
        c.slug = slug;
        c.name = name;
        c.startsAt = startsAt;
        c.endsAt = endsAt;
        return c;
    }

    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public OffsetDateTime getStartsAt() { return startsAt; }
    public void setStartsAt(OffsetDateTime startsAt) { this.startsAt = startsAt; }
    public OffsetDateTime getEndsAt() { return endsAt; }
    public void setEndsAt(OffsetDateTime endsAt) { this.endsAt = endsAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getHeroTitle() { return heroTitle; }
    public void setHeroTitle(String heroTitle) { this.heroTitle = heroTitle; }
    public String getHeroSubtitle() { return heroSubtitle; }
    public void setHeroSubtitle(String heroSubtitle) { this.heroSubtitle = heroSubtitle; }
    public String getHeroImageUrl() { return heroImageUrl; }
    public void setHeroImageUrl(String heroImageUrl) { this.heroImageUrl = heroImageUrl; }
    public String getCtaLabel() { return ctaLabel; }
    public void setCtaLabel(String ctaLabel) { this.ctaLabel = ctaLabel; }
    public String getCtaUrl() { return ctaUrl; }
    public void setCtaUrl(String ctaUrl) { this.ctaUrl = ctaUrl; }
    public String getThemeColor() { return themeColor; }
    public void setThemeColor(String themeColor) { this.themeColor = themeColor; }
    public UUID getBannerId() { return bannerId; }
    public void setBannerId(UUID bannerId) { this.bannerId = bannerId; }
    public UUID[] getPinnedStoreIds() { return pinnedStoreIds; }
    public void setPinnedStoreIds(UUID[] pinnedStoreIds) {
        this.pinnedStoreIds = pinnedStoreIds == null ? new UUID[0] : pinnedStoreIds;
    }
    public UUID[] getPinnedCouponIds() { return pinnedCouponIds; }
    public void setPinnedCouponIds(UUID[] pinnedCouponIds) {
        this.pinnedCouponIds = pinnedCouponIds == null ? new UUID[0] : pinnedCouponIds;
    }
}
