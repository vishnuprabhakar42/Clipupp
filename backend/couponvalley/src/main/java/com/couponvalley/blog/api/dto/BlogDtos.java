package com.couponvalley.blog.api.dto;

import com.couponvalley.blog.domain.Article;
import com.couponvalley.blog.domain.ArticleStatus;
import com.couponvalley.blog.domain.Author;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class BlogDtos {

    private BlogDtos() {}

    public record AuthorDetail(UUID id, String slug, String name, String bio, String avatarUrl) {
        public static AuthorDetail from(Author a) {
            return new AuthorDetail(a.getId(), a.getSlug(), a.getName(), a.getBio(), a.getAvatarUrl());
        }
    }

    public record AuthorCreate(@NotBlank @Size(max = 200) String name,
                               @Size(max = 120) String slug,
                               String bio,
                               @Size(max = 500) String avatarUrl) {}

    public record AuthorUpdate(@Size(max = 200) String name,
                               @Size(max = 120) String slug,
                               String bio,
                               @Size(max = 500) String avatarUrl) {}

    public record ArticleSummary(UUID id, String slug, String title, String excerpt,
                                 String heroImageUrl, ArticleStatus status,
                                 OffsetDateTime publishedAt, OffsetDateTime scheduledFor,
                                 UUID authorId) {
        public static ArticleSummary from(Article a) {
            return new ArticleSummary(a.getId(), a.getSlug(), a.getTitle(), a.getExcerpt(),
                    a.getHeroImageUrl(), a.getStatus(), a.getPublishedAt(), a.getScheduledFor(),
                    a.getAuthorId());
        }
    }

    public record ArticleDetail(UUID id, String slug, String title, String excerpt, String bodyMd,
                                String heroImageUrl, ArticleStatus status,
                                OffsetDateTime publishedAt, OffsetDateTime scheduledFor,
                                String metaTitle, String metaDescription,
                                AuthorDetail author) {
        public static ArticleDetail from(Article a, Author author) {
            return new ArticleDetail(a.getId(), a.getSlug(), a.getTitle(), a.getExcerpt(),
                    a.getBodyMd(), a.getHeroImageUrl(), a.getStatus(), a.getPublishedAt(),
                    a.getScheduledFor(), a.getMetaTitle(), a.getMetaDescription(),
                    author == null ? null : AuthorDetail.from(author));
        }
    }

    public record ArticleCreate(@NotBlank @Size(max = 200) String title,
                                @Size(max = 180) String slug,
                                @NotBlank @Size(max = 500) String excerpt,
                                @NotBlank String bodyMd,
                                @NotNull UUID authorId,
                                @Size(max = 500) String heroImageUrl,
                                @Size(max = 70) String metaTitle,
                                @Size(max = 170) String metaDescription) {}

    public record ArticleUpdate(@Size(max = 200) String title,
                                @Size(max = 180) String slug,
                                @Size(max = 500) String excerpt,
                                String bodyMd,
                                UUID authorId,
                                @Size(max = 500) String heroImageUrl,
                                @Size(max = 70) String metaTitle,
                                @Size(max = 170) String metaDescription) {}

    public record ArticleTransition(@NotBlank String action, OffsetDateTime when) {}
}
