package com.clipupp.blog.infra;

import com.clipupp.blog.domain.Article;
import com.clipupp.blog.domain.ArticleStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleRepository extends JpaRepository<Article, UUID> {

    @Query("""
           select a from Article a
           where a.slug = :slug and a.deletedAt is null
           """)
    Optional<Article> findActiveBySlug(@Param("slug") String slug);

    boolean existsBySlug(String slug);

    @Query("""
           select a from Article a
           where a.deletedAt is null and a.status = 'PUBLISHED'
             and a.publishedAt is not null
           order by a.publishedAt desc
           """)
    Page<Article> listPublished(Pageable pageable);

    @Query("""
           select a from Article a
           where a.deletedAt is null
             and (:status is null or a.status = :status)
           order by a.updatedAt desc
           """)
    Page<Article> adminList(@Param("status") ArticleStatus status, Pageable pageable);
}
