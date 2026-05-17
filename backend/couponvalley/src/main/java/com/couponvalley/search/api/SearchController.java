package com.couponvalley.search.api;

import com.couponvalley.search.api.dto.SearchResponse;
import com.couponvalley.search.application.SearchService;
import com.couponvalley.search.application.SearchService.SearchType;
import com.couponvalley.search.infra.SearchRepository.SearchHit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/search", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "search", description = "Catalog search powered by Postgres FTS + pg_trgm")
@SecurityRequirements
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    @Operation(summary = "Search across stores, coupons, and categories")
    public ResponseEntity<SearchResponse> search(
            @RequestParam("q") String query,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String country) {
        var result = searchService.full(query, SearchType.from(type), country);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofSeconds(30)).cachePublic())
                .body(SearchResponse.from(result));
    }

    @GetMapping("/suggest")
    @Operation(summary = "Top-K autocomplete suggestions across all types (cached 60s)")
    public ResponseEntity<List<SearchResponse.HitDto>> suggest(
            @RequestParam("q") String query,
            @RequestParam(required = false) String country) {
        List<SearchHit> hits = searchService.suggest(query, country);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofSeconds(60)).cachePublic())
                .body(hits.stream().map(SearchResponse.HitDto::from).toList());
    }
}
