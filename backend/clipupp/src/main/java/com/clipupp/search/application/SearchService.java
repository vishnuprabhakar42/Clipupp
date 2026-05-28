package com.clipupp.search.application;

import com.clipupp.search.infra.SearchRepository;
import com.clipupp.search.infra.SearchRepository.SearchHit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SearchService {

    private static final int FULL_LIMIT = 20;
    private static final int SUGGEST_LIMIT = 8;

    private final SearchRepository repo;

    public SearchService(SearchRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public SearchResult full(String query, SearchType type, String countryCode) {
        List<SearchHit> stores = (type == SearchType.STORE || type == SearchType.ALL)
                ? repo.searchStores(query, countryCode, FULL_LIMIT) : List.of();
        List<SearchHit> coupons = (type == SearchType.COUPON || type == SearchType.ALL)
                ? repo.searchCoupons(query, FULL_LIMIT) : List.of();
        List<SearchHit> categories = (type == SearchType.CATEGORY || type == SearchType.ALL)
                ? repo.searchCategories(query, FULL_LIMIT) : List.of();
        return new SearchResult(stores, coupons, categories);
    }

    /**
     * Autocomplete: top results across types in a single flat list. Cached
     * on the {@code search.suggest} Caffeine cache keyed by (locale, query).
     */
    @Cacheable(cacheNames = "search.suggest",
            key = "T(java.util.Objects).hash(#query, #countryCode)",
            unless = "#result == null || #result.isEmpty()")
    @Transactional(readOnly = true)
    public List<SearchHit> suggest(String query, String countryCode) {
        if (query == null || query.length() < 2) return List.of();
        List<SearchHit> hits = new ArrayList<>(SUGGEST_LIMIT);
        // Prioritize coupons (highest user intent), then stores, then categories.
        hits.addAll(repo.searchCoupons(query, SUGGEST_LIMIT));
        if (hits.size() < SUGGEST_LIMIT) {
            hits.addAll(repo.searchStores(query, countryCode, SUGGEST_LIMIT - hits.size()));
        }
        if (hits.size() < SUGGEST_LIMIT) {
            hits.addAll(repo.searchCategories(query, SUGGEST_LIMIT - hits.size()));
        }
        return hits.size() > SUGGEST_LIMIT ? hits.subList(0, SUGGEST_LIMIT) : hits;
    }

    public enum SearchType {
        ALL, STORE, COUPON, CATEGORY;

        public static SearchType from(String s) {
            if (s == null || s.isBlank()) return ALL;
            try { return SearchType.valueOf(s.trim().toUpperCase()); }
            catch (IllegalArgumentException ex) { return ALL; }
        }
    }

    public record SearchResult(List<SearchHit> stores, List<SearchHit> coupons, List<SearchHit> categories) {}
}
