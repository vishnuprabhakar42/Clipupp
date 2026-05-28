package com.clipupp.stores.domain;

import com.clipupp.common.audit.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "store")
public class Store extends AuditableEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "slug", nullable = false, length = 120, unique = true)
    private String slug;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "logo_url", nullable = false)
    private String logoUrl;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "short_description", length = 280)
    private String shortDescription;

    @Column(name = "rating", precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "review_count", nullable = false)
    private int reviewCount;

    @Column(name = "phone", length = 40)
    private String phone;

    @Column(name = "address")
    private String address;

    @Column(name = "primary_url", nullable = false)
    private String primaryUrl;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StoreStatus status = StoreStatus.ACTIVE;

    @Column(name = "popularity_score", nullable = false)
    private int popularityScore;

    @Column(name = "brand_color", length = 7)
    private String brandColor;

    @Column(name = "cashback_rate", length = 40)
    private String cashbackRate;

    @Column(name = "previous_cashback_rate", length = 40)
    private String previousCashbackRate;

    @Column(name = "tagline", length = 120)
    private String tagline;

    @Column(name = "is_featured", nullable = false)
    private boolean featured = false;

    @Column(name = "featured_position")
    private Integer featuredPosition;

    @Column(name = "meta_title", length = 70)
    private String metaTitle;

    @Column(name = "meta_description", length = 170)
    private String metaDescription;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    protected Store() {}

    public static Store create(String slug, String name, String logoUrl, String description,
                               String primaryUrl, String countryCode) {
        Store s = new Store();
        s.id = UUID.randomUUID();
        s.slug = slug;
        s.name = name;
        s.logoUrl = logoUrl;
        s.description = description;
        s.primaryUrl = primaryUrl;
        s.countryCode = countryCode;
        return s;
    }

    public void softDelete() {
        this.status = StoreStatus.DELETED;
        this.deletedAt = OffsetDateTime.now();
    }

    public void restore() {
        this.deletedAt = null;
        this.status = StoreStatus.ACTIVE;
    }

    // getters/setters
    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }
    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }
    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPrimaryUrl() { return primaryUrl; }
    public void setPrimaryUrl(String primaryUrl) { this.primaryUrl = primaryUrl; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public StoreStatus getStatus() { return status; }
    public void setStatus(StoreStatus status) { this.status = status; }
    public int getPopularityScore() { return popularityScore; }
    public void setPopularityScore(int popularityScore) { this.popularityScore = popularityScore; }
    public String getBrandColor() { return brandColor; }
    public void setBrandColor(String brandColor) { this.brandColor = brandColor; }
    public String getCashbackRate() { return cashbackRate; }
    public void setCashbackRate(String cashbackRate) { this.cashbackRate = cashbackRate; }
    public String getPreviousCashbackRate() { return previousCashbackRate; }
    public void setPreviousCashbackRate(String previousCashbackRate) { this.previousCashbackRate = previousCashbackRate; }
    public String getTagline() { return tagline; }
    public void setTagline(String tagline) { this.tagline = tagline; }
    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }
    public Integer getFeaturedPosition() { return featuredPosition; }
    public void setFeaturedPosition(Integer p) { this.featuredPosition = p; }
    public String getMetaTitle() { return metaTitle; }
    public void setMetaTitle(String metaTitle) { this.metaTitle = metaTitle; }
    public String getMetaDescription() { return metaDescription; }
    public void setMetaDescription(String metaDescription) { this.metaDescription = metaDescription; }
    public OffsetDateTime getDeletedAt() { return deletedAt; }
}
