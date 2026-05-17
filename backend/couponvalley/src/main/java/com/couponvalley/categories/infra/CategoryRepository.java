package com.couponvalley.categories.infra;

import com.couponvalley.categories.domain.Category;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findBySlug(String slug);
    boolean existsBySlug(String slug);

    @Query("select c from Category c where c.active = true order by c.position asc, c.title asc")
    List<Category> findAllActive();

    @Query("select c from Category c where c.parentId = :parentId and c.active = true order by c.position asc, c.title asc")
    List<Category> findActiveChildren(@Param("parentId") UUID parentId);

    @Query("select c from Category c where c.parentId is null and c.active = true order by c.position asc, c.title asc")
    List<Category> findActiveRoots();

    @Query("select c from Category c order by c.position asc, c.title asc")
    List<Category> findAllForAdmin();

    @Query("""
           select c from Category c
           where c.active = true and c.featured = true
           order by coalesce(c.featuredPosition, 9999) asc, c.position asc, c.title asc
           """)
    List<Category> findFeatured();
}
