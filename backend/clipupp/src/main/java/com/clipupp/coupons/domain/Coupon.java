package com.clipupp.coupons.domain;

import com.clipupp.categories.domain.Category;
import com.clipupp.common.audit.AuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "coupon")
public class Coupon extends AuditableEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "slug", nullable = false, length = 180, unique = true)
    private String slug;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private CouponType type;

    @Column(name = "code", length = 60)
    private String code;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "terms")
    private String terms;

    @Column(name = "savings_label", length = 60)
    private String savingsLabel;

    @Column(name = "min_purchase", precision = 19, scale = 4)
    private BigDecimal minPurchase;

    @Column(name = "min_purchase_currency", length = 3)
    private String minPurchaseCurrency;

    @Column(name = "starts_at")
    private OffsetDateTime startsAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CouponStatus status = CouponStatus.ACTIVE;

    @Column(name = "verified", nullable = false)
    private boolean verified;

    /** When an admin last marked this coupon verified. Null when not verified. */
    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;

    @Column(name = "exclusive", nullable = false)
    private boolean exclusive;

    @Column(name = "used_count", nullable = false)
    private int usedCount;

    @Column(name = "click_count", nullable = false)
    private int clickCount;

    @Column(name = "popularity_score", nullable = false)
    private int popularityScore;

    @Column(name = "is_featured", nullable = false)
    private boolean featured = false;

    @Column(name = "featured_position")
    private Integer featuredPosition;

    @Column(name = "affiliate_url_override")
    private String affiliateUrlOverride;

    @Column(name = "meta_title", length = 70)
    private String metaTitle;

    @Column(name = "meta_description", length = 170)
    private String metaDescription;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "coupon_category",
            joinColumns = @JoinColumn(name = "coupon_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id"))
    @BatchSize(size = 50)
    private Set<Category> categories = new HashSet<>();

    protected Coupon() {}

    public static Coupon create(String slug, UUID storeId, CouponType type, String title, String description) {
        Coupon c = new Coupon();
        c.id = UUID.randomUUID();
        c.slug = slug;
        c.storeId = storeId;
        c.type = type;
        c.title = title;
        c.description = description;
        return c;
    }

    public boolean isExpiredAt(OffsetDateTime when) {
        return expiresAt != null && expiresAt.isBefore(when);
    }

    public void softDelete() {
        this.status = CouponStatus.DELETED;
        this.deletedAt = OffsetDateTime.now();
    }

    public void restore() {
        this.deletedAt = null;
        this.status = CouponStatus.ACTIVE;
    }

    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public UUID getStoreId() { return storeId; }
    public CouponType getType() { return type; }
    public void setType(CouponType type) { this.type = type; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTerms() { return terms; }
    public void setTerms(String terms) { this.terms = terms; }
    public String getSavingsLabel() { return savingsLabel; }
    public void setSavingsLabel(String savingsLabel) { this.savingsLabel = savingsLabel; }
    public BigDecimal getMinPurchase() { return minPurchase; }
    public void setMinPurchase(BigDecimal v) { this.minPurchase = v; }
    public String getMinPurchaseCurrency() { return minPurchaseCurrency; }
    public void setMinPurchaseCurrency(String c) { this.minPurchaseCurrency = c; }
    public OffsetDateTime getStartsAt() { return startsAt; }
    public void setStartsAt(OffsetDateTime t) { this.startsAt = t; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime t) { this.expiresAt = t; }
    public CouponStatus getStatus() { return status; }
    public void setStatus(CouponStatus status) { this.status = status; }
    public boolean isVerified() { return verified; }
    public OffsetDateTime getVerifiedAt() { return verifiedAt; }

    /**
     * The only way verification state changes. Verifying always refreshes the
     * timestamp (an admin re-checking a code is a fresh verification);
     * unverifying clears it so the UI never shows a stale "Verified 3d ago".
     */
    public void applyVerified(boolean verified, OffsetDateTime now) {
        this.verified = verified;
        this.verifiedAt = verified ? now : null;
    }

    public void setVerified(boolean v) { applyVerified(v, OffsetDateTime.now()); }
    public boolean isExclusive() { return exclusive; }
    public void setExclusive(boolean e) { this.exclusive = e; }
    public int getUsedCount() { return usedCount; }
    public void setUsedCount(int v) { this.usedCount = v; }
    public int getClickCount() { return clickCount; }
    public void setClickCount(int v) { this.clickCount = v; }
    public int getPopularityScore() { return popularityScore; }
    public void setPopularityScore(int v) { this.popularityScore = v; }
    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean v) { this.featured = v; }
    public Integer getFeaturedPosition() { return featuredPosition; }
    public void setFeaturedPosition(Integer p) { this.featuredPosition = p; }
    public String getAffiliateUrlOverride() { return affiliateUrlOverride; }
    public void setAffiliateUrlOverride(String u) { this.affiliateUrlOverride = u; }
    public String getMetaTitle() { return metaTitle; }
    public void setMetaTitle(String mt) { this.metaTitle = mt; }
    public String getMetaDescription() { return metaDescription; }
    public void setMetaDescription(String md) { this.metaDescription = md; }
    public OffsetDateTime getDeletedAt() { return deletedAt; }
    public Set<Category> getCategories() { return categories; }
    public void setCategories(Set<Category> categories) { this.categories = categories; }
}
