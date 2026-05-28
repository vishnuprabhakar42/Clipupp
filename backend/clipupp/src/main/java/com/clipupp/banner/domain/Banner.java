package com.clipupp.banner.domain;

import com.clipupp.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "banner")
public class Banner extends AuditableEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "position", nullable = false)
    private short position;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "subtitle", length = 280)
    private String subtitle;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "link_url", nullable = false)
    private String linkUrl;

    @Column(name = "starts_at")
    private OffsetDateTime startsAt;

    @Column(name = "ends_at")
    private OffsetDateTime endsAt;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "country_code", length = 2)
    private String countryCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "placement", nullable = false, length = 20)
    private BannerPlacement placement = BannerPlacement.HERO_CAROUSEL;

    protected Banner() {}

    public static Banner create(String title, String imageUrl, String linkUrl, short position) {
        Banner b = new Banner();
        b.id = UUID.randomUUID();
        b.title = title;
        b.imageUrl = imageUrl;
        b.linkUrl = linkUrl;
        b.position = position;
        return b;
    }

    public boolean isLiveAt(OffsetDateTime now) {
        if (!active) return false;
        if (startsAt != null && now.isBefore(startsAt)) return false;
        if (endsAt != null && now.isAfter(endsAt)) return false;
        return true;
    }

    public UUID getId() { return id; }
    public short getPosition() { return position; }
    public void setPosition(short p) { this.position = p; }
    public String getTitle() { return title; }
    public void setTitle(String t) { this.title = t; }
    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String s) { this.subtitle = s; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String u) { this.imageUrl = u; }
    public String getLinkUrl() { return linkUrl; }
    public void setLinkUrl(String u) { this.linkUrl = u; }
    public OffsetDateTime getStartsAt() { return startsAt; }
    public void setStartsAt(OffsetDateTime s) { this.startsAt = s; }
    public OffsetDateTime getEndsAt() { return endsAt; }
    public void setEndsAt(OffsetDateTime e) { this.endsAt = e; }
    public boolean isActive() { return active; }
    public void setActive(boolean a) { this.active = a; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String c) { this.countryCode = c; }
    public BannerPlacement getPlacement() { return placement; }
    public void setPlacement(BannerPlacement p) { this.placement = p == null ? BannerPlacement.HERO_CAROUSEL : p; }
}
