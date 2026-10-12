package com.clipupp.stores.infra;

import com.clipupp.stores.domain.Store;
import com.clipupp.stores.domain.StoreStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreRepository extends JpaRepository<Store, UUID> {

    Optional<Store> findBySlugAndDeletedAtIsNull(String slug);
    boolean existsBySlug(String slug);

    @Query("""
           select s from Store s
           where s.deletedAt is null
             and s.status = :status
             and (:countryCode is null or s.countryCode = :countryCode)
           order by s.popularityScore desc, s.name asc
           """)
    Page<Store> listActive(@Param("status") StoreStatus status,
                           @Param("countryCode") String countryCode,
                           Pageable pageable);

    @Query(value = """
           select s.* from store s
             join store_category sc on sc.store_id = s.id
             join category c on c.id = sc.category_id
           where s.deleted_at is null
             and s.status = 'ACTIVE'
             and c.slug = :categorySlug
             and (:countryCode is null or s.country_code = :countryCode)
           order by s.popularity_score desc, s.name asc
           """,
           countQuery = """
           select count(*) from store s
             join store_category sc on sc.store_id = s.id
             join category c on c.id = sc.category_id
           where s.deleted_at is null
             and s.status = 'ACTIVE'
             and c.slug = :categorySlug
             and (:countryCode is null or s.country_code = :countryCode)
           """,
           nativeQuery = true)
    Page<Store> listByCategorySlug(@Param("categorySlug") String categorySlug,
                                   @Param("countryCode") String countryCode,
                                   Pageable pageable);

    @Query("""
           select s from Store s
           where s.deletedAt is null
             and s.status = 'ACTIVE'
             and s.featured = true
           order by coalesce(s.featuredPosition, 9999) asc, s.popularityScore desc
           """)
    java.util.List<Store> findFeatured();

    /**
     * Slug-only projection of the top-N active stores by popularity. Used at
     * Next.js build time by `generateStaticParams` on `/stores/[slug]` —
     * pre-renders the highest-traffic store pages so Googlebot hits a warm
     * cache on every crawl.
     */
    @Query("""
           select s.slug from Store s
           where s.deletedAt is null
             and s.status = 'ACTIVE'
           order by s.popularityScore desc, s.name asc
           """)
    java.util.List<String> findTopSlugs(Pageable pageable);

    @Query("""
           select s from Store s
           where (:q is null or lower(s.name) like concat('%', :q, '%') or lower(s.slug) like concat('%', :q, '%'))
             and (:countryCode is null or s.countryCode = :countryCode)
             and (:status is null or s.status = :status)
             and (:featured is null or s.featured = :featured)
           order by s.popularityScore desc, s.name asc
           """)
    Page<Store> adminSearch(@Param("q") String q,
                            @Param("countryCode") String countryCode,
                            @Param("status") StoreStatus status,
                            @Param("featured") Boolean featured,
                            Pageable pageable);

    @Query("""
           select s from Store s
           where s.deletedAt is null
             and s.status = :status
             and s.id <> :excludeId
             and exists (
                select 1 from Coupon c
                  join c.categories cat
                  where c.storeId = s.id
                    and cat.id in (
                       select cat2.id from Coupon c2 join c2.categories cat2
                       where c2.storeId = :excludeId
                    )
             )
           order by s.popularityScore desc
           """)
    Page<Store> findSimilarTo(@Param("excludeId") UUID excludeId,
                              @Param("status") StoreStatus status,
                              Pageable pageable);

    @Query("select count(s) from Store s where s.status = :status and s.deletedAt is null")
    long countActive(@Param("status") StoreStatus status);
}
