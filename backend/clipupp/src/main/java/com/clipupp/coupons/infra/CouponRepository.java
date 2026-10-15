package com.clipupp.coupons.infra;

import com.clipupp.coupons.domain.Coupon;
import com.clipupp.coupons.domain.CouponStatus;
import com.clipupp.coupons.domain.CouponType;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, UUID> {

    @EntityGraph(attributePaths = "categories")
    Optional<Coupon> findBySlugAndDeletedAtIsNull(String slug);

    boolean existsBySlug(String slug);

    @Query("""
           select c from Coupon c
           where c.deletedAt is null
             and c.status = :status
             and (:storeId is null or c.storeId = :storeId)
             and (:types is null or c.type in :types)
             and (:notExpiredAt is null or c.expiresAt is null or c.expiresAt > :notExpiredAt)
           order by c.popularityScore desc, c.createdAt desc
           """)
    Page<Coupon> listActive(@Param("status") CouponStatus status,
                            @Param("storeId") UUID storeId,
                            @Param("types") Set<CouponType> types,
                            @Param("notExpiredAt") OffsetDateTime notExpiredAt,
                            Pageable pageable);

    @Query(value = """
           select c.* from coupon c
             join coupon_category cc on cc.coupon_id = c.id
             join category cat on cat.id = cc.category_id
           where c.deleted_at is null
             and c.status = 'ACTIVE'
             and cat.slug = :categorySlug
             and (c.expires_at is null or c.expires_at > now())
           order by c.popularity_score desc, c.created_at desc
           """,
           countQuery = """
           select count(*) from coupon c
             join coupon_category cc on cc.coupon_id = c.id
             join category cat on cat.id = cc.category_id
           where c.deleted_at is null
             and c.status = 'ACTIVE'
             and cat.slug = :categorySlug
             and (c.expires_at is null or c.expires_at > now())
           """,
           nativeQuery = true)
    Page<Coupon> listByCategorySlug(@Param("categorySlug") String categorySlug, Pageable pageable);

    @EntityGraph(attributePaths = "categories")
    @Query("""
           select c from Coupon c
           where c.deletedAt is null
             and c.status = :status
             and c.storeId = :storeId
             and (c.expiresAt is null or c.expiresAt > :now)
           order by c.popularityScore desc, c.createdAt desc
           """)
    Page<Coupon> listForStore(@Param("storeId") UUID storeId,
                              @Param("status") CouponStatus status,
                              @Param("now") OffsetDateTime now,
                              Pageable pageable);

    @Query("""
           select count(c) from Coupon c
           where c.deletedAt is null
             and c.status = :status
             and c.storeId = :storeId
             and (c.expiresAt is null or c.expiresAt > :now)
           """)
    long countActiveForStore(@Param("storeId") UUID storeId,
                             @Param("status") CouponStatus status,
                             @Param("now") OffsetDateTime now);

    @Query("""
           select c.type, count(c) from Coupon c
           where c.deletedAt is null
             and c.status = :status
             and c.storeId = :storeId
             and (c.expiresAt is null or c.expiresAt > :now)
           group by c.type
           """)
    List<Object[]> countByTypeForStore(@Param("storeId") UUID storeId,
                                       @Param("status") CouponStatus status,
                                       @Param("now") OffsetDateTime now);

    /**
     * No @EntityGraph here: a fetch join plus Pageable makes Hibernate paginate
     * in memory (HHH90003004). Categories are @BatchSize-loaded by the caller.
     */
    @Query("""
           select c from Coupon c
           where c.deletedAt is null
             and c.status = 'ACTIVE'
             and (c.expiresAt is null or c.expiresAt > :now)
           order by c.popularityScore desc, c.createdAt desc
           """)
    List<Coupon> findHomepageTop(@Param("now") OffsetDateTime now, Pageable pageable);

    @EntityGraph(attributePaths = "categories")
    @Query("""
           select c from Coupon c
           where c.deletedAt is null
             and c.status = 'ACTIVE'
             and c.featured = true
             and (c.expiresAt is null or c.expiresAt > :now)
           order by coalesce(c.featuredPosition, 9999) asc, c.popularityScore desc
           """)
    List<Coupon> findFeatured(@Param("now") OffsetDateTime now);

    /**
     * Slug-only projection of the top-N active, non-expired coupons by
     * popularity. Used at Next.js build time by `generateStaticParams` on
     * `/coupons/[slug]` — pre-renders the highest-traffic coupon pages so
     * Googlebot hits a warm cache on every crawl.
     */
    @Query("""
           select c.slug from Coupon c
           where c.deletedAt is null
             and c.status = 'ACTIVE'
             and (c.expiresAt is null or c.expiresAt > :now)
           order by c.popularityScore desc, c.createdAt desc
           """)
    List<String> findTopSlugs(@Param("now") OffsetDateTime now, Pageable pageable);

    @EntityGraph(attributePaths = "categories")
    @Query("""
           select c from Coupon c
           where (:q is null or lower(c.title) like concat('%', :q, '%') or lower(c.slug) like concat('%', :q, '%'))
             and (:storeId is null or c.storeId = :storeId)
             and (:status is null or c.status = :status)
             and (:type is null or c.type = :type)
           order by c.createdAt desc
           """)
    Page<Coupon> adminSearch(@Param("q") String q,
                             @Param("storeId") UUID storeId,
                             @Param("status") CouponStatus status,
                             @Param("type") CouponType type,
                             Pageable pageable);

    /**
     * Trending = verified, active, most popular first, then most recently verified.
     * No @EntityGraph (see findHomepageTop): categories load in one batched query.
     */
    @Query("""
           select c from Coupon c
           where c.deletedAt is null
             and c.status = 'ACTIVE'
             and c.verified = true
             and (c.expiresAt is null or c.expiresAt > :now)
           order by c.popularityScore desc, c.verifiedAt desc nulls last, c.createdAt desc
           """)
    List<Coupon> findTrendingVerified(@Param("now") OffsetDateTime now, Pageable pageable);

    /** One round-trip for N store tiles: [storeId, count]. Stores with 0 are absent. */
    @Query("""
           select c.storeId, count(c) from Coupon c
           where c.deletedAt is null
             and c.status = 'ACTIVE'
             and c.storeId in :storeIds
             and (c.expiresAt is null or c.expiresAt > :now)
           group by c.storeId
           """)
    List<Object[]> countActiveByStoreIds(@Param("storeIds") Collection<UUID> storeIds,
                                         @Param("now") OffsetDateTime now);

    @Query("""
           select count(c) from Coupon c
           where c.deletedAt is null
             and c.status = 'ACTIVE'
             and c.verified = true
             and c.verifiedAt >= :since
             and (c.expiresAt is null or c.expiresAt > :now)
           """)
    long countVerifiedSince(@Param("since") OffsetDateTime since, @Param("now") OffsetDateTime now);

    @Query("""
           select count(c) from Coupon c
           where c.deletedAt is null
             and c.status = 'ACTIVE'
             and (c.expiresAt is null or c.expiresAt > :now)
           """)
    long countActive(@Param("now") OffsetDateTime now);
}
