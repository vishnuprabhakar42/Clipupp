package com.couponvalley.admin.api;

import com.couponvalley.blog.application.BlogService;
import com.couponvalley.blog.api.dto.BlogDtos;
import com.couponvalley.blog.domain.Article;
import com.couponvalley.blog.domain.ArticleStatus;
import com.couponvalley.blog.domain.Author;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/admin/blog", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "admin/blog", description = "Article + Author CRUD")
public class AdminBlogController {

    private final BlogService blogService;

    public AdminBlogController(BlogService blogService) {
        this.blogService = blogService;
    }

    // ---- Authors -----------------------------------------------------------

    @GetMapping(value = "/authors", consumes = MediaType.ALL_VALUE)
    public List<BlogDtos.AuthorDetail> listAuthors() {
        return blogService.listAuthors().stream().map(BlogDtos.AuthorDetail::from).toList();
    }

    @GetMapping(value = "/authors/{id}", consumes = MediaType.ALL_VALUE)
    public BlogDtos.AuthorDetail getAuthor(@PathVariable UUID id) {
        return BlogDtos.AuthorDetail.from(blogService.findAuthor(id));
    }

    @PostMapping(value = "/authors", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Create an author")
    public ResponseEntity<BlogDtos.AuthorDetail> createAuthor(@RequestBody @Valid BlogDtos.AuthorCreate input) {
        Author a = blogService.createAuthor(input.name(), input.slug(), input.bio(), input.avatarUrl());
        return ResponseEntity.status(HttpStatus.CREATED).body(BlogDtos.AuthorDetail.from(a));
    }

    @PatchMapping(value = "/authors/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public BlogDtos.AuthorDetail updateAuthor(@PathVariable UUID id,
                                              @RequestBody @Valid BlogDtos.AuthorUpdate input) {
        Author a = blogService.updateAuthor(id, input.name(), input.slug(), input.bio(), input.avatarUrl());
        return BlogDtos.AuthorDetail.from(a);
    }

    // ---- Articles ----------------------------------------------------------

    @GetMapping(value = "/articles", consumes = MediaType.ALL_VALUE)
    public Page<BlogDtos.ArticleSummary> listArticles(
            @RequestParam(required = false) ArticleStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return blogService.adminList(status, PageRequest.of(page, Math.max(1, Math.min(size, 200))))
                .map(BlogDtos.ArticleSummary::from);
    }

    @GetMapping(value = "/articles/{id}", consumes = MediaType.ALL_VALUE)
    public BlogDtos.ArticleDetail getArticle(@PathVariable UUID id) {
        Article a = blogService.findArticle(id);
        Author author = blogService.findAuthorOpt(a.getAuthorId()).orElse(null);
        return BlogDtos.ArticleDetail.from(a, author);
    }

    @PostMapping(value = "/articles", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<BlogDtos.ArticleSummary> createArticle(@RequestBody @Valid BlogDtos.ArticleCreate input) {
        Article a = blogService.createArticle(input.title(), input.slug(), input.excerpt(),
                input.bodyMd(), input.authorId(), input.heroImageUrl(),
                input.metaTitle(), input.metaDescription());
        return ResponseEntity.status(HttpStatus.CREATED).body(BlogDtos.ArticleSummary.from(a));
    }

    @PatchMapping(value = "/articles/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public BlogDtos.ArticleSummary updateArticle(@PathVariable UUID id,
                                                 @RequestBody @Valid BlogDtos.ArticleUpdate input) {
        Article a = blogService.updateArticle(id, input.title(), input.slug(), input.excerpt(),
                input.bodyMd(), input.authorId(), input.heroImageUrl(),
                input.metaTitle(), input.metaDescription());
        return BlogDtos.ArticleSummary.from(a);
    }

    @PostMapping(value = "/articles/{id}/transition", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "PUBLISH | SCHEDULE | HIDE | DELETE")
    public BlogDtos.ArticleSummary transition(@PathVariable UUID id,
                                              @RequestBody @Valid BlogDtos.ArticleTransition input) {
        Article a = blogService.transition(id, input.action(), input.when());
        return BlogDtos.ArticleSummary.from(a);
    }
}
