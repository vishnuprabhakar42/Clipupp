package com.clipupp.blog.infra;

import com.clipupp.blog.domain.Author;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuthorRepository extends JpaRepository<Author, UUID> {
    Optional<Author> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
