package com.couponvalley.blog.infra;

import com.couponvalley.blog.domain.Author;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuthorRepository extends JpaRepository<Author, UUID> {
    Optional<Author> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
