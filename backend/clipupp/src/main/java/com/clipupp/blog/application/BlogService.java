package com.clipupp.blog.application;

import com.clipupp.blog.domain.Article;
import com.clipupp.blog.domain.ArticleStatus;
import com.clipupp.blog.domain.Author;
import com.clipupp.blog.infra.ArticleRepository;
import com.clipupp.blog.infra.AuthorRepository;
import com.clipupp.common.audit.AuditLogService;
import com.clipupp.common.error.ApiException;
import com.clipupp.common.text.Slugifier;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BlogService {

    private final ArticleRepository articleRepo;
    private final AuthorRepository authorRepo;
    private final AuditLogService audit;

    public BlogService(ArticleRepository articleRepo, AuthorRepository authorRepo, AuditLogService audit) {
        this.articleRepo = articleRepo;
        this.authorRepo = authorRepo;
        this.audit = audit;
    }

    // ---- Authors -----------------------------------------------------------

    @Transactional
    public Author createAuthor(String name, String slug, String bio, String avatarUrl) {
        String finalSlug = (slug == null || slug.isBlank()) ? Slugifier.slugify(name) : Slugifier.slugify(slug);
        if (finalSlug.isBlank()) {
            throw new ApiException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_SLUG", "Cannot derive slug");
        }
        if (authorRepo.existsBySlug(finalSlug)) {
            throw ApiException.conflict("Author slug already in use");
        }
        Author a = Author.create(finalSlug, name);
        a.setBio(bio);
        a.setAvatarUrl(avatarUrl);
        Author saved = authorRepo.save(a);
        audit.record("AUTHOR_CREATE", "author", saved.getId(), Map.of("slug", finalSlug));
        return saved;
    }

    @Transactional
    public Author updateAuthor(UUID id, String name, String slug, String bio, String avatarUrl) {
        Author a = authorRepo.findById(id).orElseThrow(() -> ApiException.notFound("Author not found"));
        if (name != null) a.setName(name);
        if (slug != null) {
            String s = Slugifier.slugify(slug);
            if (!s.equals(a.getSlug())) {
                if (authorRepo.existsBySlug(s)) throw ApiException.conflict("Slug already in use");
                a.setSlug(s);
            }
        }
        if (bio != null) a.setBio(bio);
        if (avatarUrl != null) a.setAvatarUrl(avatarUrl);
        audit.record("AUTHOR_UPDATE", "author", a.getId(), Map.of("slug", a.getSlug()));
        return a;
    }

    @Transactional(readOnly = true)
    public java.util.List<Author> listAuthors() {
        return authorRepo.findAll();
    }

    // ---- Articles ----------------------------------------------------------

    @Transactional
    public Article createArticle(String title, String slug, String excerpt, String bodyMd,
                                 UUID authorId, String heroImageUrl,
                                 String metaTitle, String metaDescription) {
        if (!authorRepo.existsById(authorId)) {
            throw ApiException.notFound("Author not found");
        }
        String finalSlug = (slug == null || slug.isBlank()) ? Slugifier.slugify(title) : Slugifier.slugify(slug);
        if (finalSlug.isBlank()) {
            throw new ApiException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "INVALID_SLUG", "Cannot derive slug");
        }
        if (articleRepo.existsBySlug(finalSlug)) {
            throw ApiException.conflict("Article slug already in use");
        }
        Article a = Article.create(finalSlug, title, excerpt, bodyMd, authorId);
        a.setHeroImageUrl(heroImageUrl);
        a.setMetaTitle(metaTitle);
        a.setMetaDescription(metaDescription);
        Article saved = articleRepo.save(a);
        audit.record("ARTICLE_CREATE", "article", saved.getId(), Map.of("slug", finalSlug));
        return saved;
    }

    @Transactional
    public Article updateArticle(UUID id, String title, String slug, String excerpt, String bodyMd,
                                 UUID authorId, String heroImageUrl,
                                 String metaTitle, String metaDescription) {
        Article a = articleRepo.findById(id).orElseThrow(() -> ApiException.notFound("Article not found"));
        if (slug != null) {
            String s = Slugifier.slugify(slug);
            if (!s.equals(a.getSlug())) {
                if (articleRepo.existsBySlug(s)) throw ApiException.conflict("Slug already in use");
                a.setSlug(s);
            }
        }
        if (title != null) a.setTitle(title);
        if (excerpt != null) a.setExcerpt(excerpt);
        if (bodyMd != null) a.setBodyMd(bodyMd);
        if (authorId != null) {
            if (!authorRepo.existsById(authorId)) throw ApiException.notFound("Author not found");
            a.setAuthorId(authorId);
        }
        if (heroImageUrl != null) a.setHeroImageUrl(heroImageUrl);
        if (metaTitle != null) a.setMetaTitle(metaTitle);
        if (metaDescription != null) a.setMetaDescription(metaDescription);
        audit.record("ARTICLE_UPDATE", "article", a.getId(), Map.of("slug", a.getSlug()));
        return a;
    }

    @Transactional
    public Article transition(UUID id, String action, OffsetDateTime when) {
        Article a = articleRepo.findById(id).orElseThrow(() -> ApiException.notFound("Article not found"));
        switch (action.toUpperCase()) {
            case "PUBLISH" -> a.publishNow();
            case "SCHEDULE" -> {
                if (when == null) {
                    throw new ApiException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                            "MISSING_TIME", "Schedule requires `when`");
                }
                a.scheduleFor(when);
            }
            case "HIDE" -> a.hide();
            case "DELETE" -> a.softDelete();
            default -> throw new ApiException(org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "UNKNOWN_ACTION", "Unknown article action: " + action);
        }
        audit.record("ARTICLE_TRANSITION", "article", a.getId(),
                Map.of("action", action.toUpperCase(), "newStatus", a.getStatus().name()));
        return a;
    }

    @Transactional(readOnly = true)
    public Page<Article> adminList(ArticleStatus status, org.springframework.data.domain.Pageable pageable) {
        return articleRepo.adminList(status, pageable);
    }

    @Transactional(readOnly = true)
    public Article findArticle(UUID id) {
        return articleRepo.findById(id).orElseThrow(() -> ApiException.notFound("Article not found"));
    }

    @Transactional(readOnly = true)
    public Author findAuthor(UUID id) {
        return authorRepo.findById(id).orElseThrow(() -> ApiException.notFound("Author not found"));
    }

    @Transactional(readOnly = true)
    public java.util.Optional<Author> findAuthorOpt(UUID id) {
        return authorRepo.findById(id);
    }

    @Transactional(readOnly = true)
    public Page<Article> publicList(org.springframework.data.domain.Pageable pageable) {
        return articleRepo.listPublished(pageable);
    }

    @Transactional(readOnly = true)
    public Article publicBySlug(String slug) {
        return articleRepo.findActiveBySlug(slug)
                .filter(a -> a.getStatus() == ArticleStatus.PUBLISHED)
                .orElseThrow(() -> ApiException.notFound("Article not found"));
    }
}
