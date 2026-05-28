package com.clipupp.blog.api;

import com.clipupp.blog.application.BlogService;
import com.clipupp.blog.api.dto.BlogDtos;
import com.clipupp.blog.domain.Article;
import com.clipupp.blog.domain.Author;
import com.clipupp.blog.infra.AuthorRepository;
import com.clipupp.common.error.ApiException;
import com.clipupp.common.pagination.CursorEncoder;
import com.clipupp.common.pagination.CursorPage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/blog", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "blog", description = "Public blog catalog")
@SecurityRequirements
public class PublicBlogController {

    private final BlogService blogService;
    private final AuthorRepository authorRepo;

    public PublicBlogController(BlogService blogService, AuthorRepository authorRepo) {
        this.blogService = blogService;
        this.authorRepo = authorRepo;
    }

    @GetMapping
    @Operation(summary = "Paginated published article list")
    public ResponseEntity<CursorPage<BlogDtos.ArticleSummary>> list(
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit) {
        int size = limit == null ? 20 : Math.max(1, Math.min(limit, 100));
        int page = CursorEncoder.decodePageOr(cursor, 0);
        Page<Article> result = blogService.publicList(PageRequest.of(page, size));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(2)).cachePublic()
                        .staleWhileRevalidate(Duration.ofMinutes(10)))
                .body(CursorPage.from(result, BlogDtos.ArticleSummary::from));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get a single published article by slug")
    public ResponseEntity<BlogDtos.ArticleDetail> bySlug(@PathVariable String slug) {
        Article a = blogService.publicBySlug(slug);
        Author author = authorRepo.findById(a.getAuthorId())
                .orElseThrow(() -> ApiException.notFound("Article author not found"));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic()
                        .staleWhileRevalidate(Duration.ofMinutes(30)))
                .body(BlogDtos.ArticleDetail.from(a, author));
    }
}
