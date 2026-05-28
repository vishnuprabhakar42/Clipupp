package com.clipupp.common.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * In-process Caffeine cache for hot reads (homepage coupons, top stores,
 * category tree, redirect lookups). Phase 1 uses a single instance — multi-
 * instance Phase 2 will swap this for a Redis-backed manager.
 */
@Configuration
public class CacheConfig {

    public static final String CACHE_STORE_DETAIL = "store.detail";
    public static final String CACHE_COUPON_DETAIL = "coupon.detail";
    public static final String CACHE_CATEGORY_TREE = "category.tree";
    public static final String CACHE_HOMEPAGE_TOP = "homepage.top";
    public static final String CACHE_REDIRECT = "coupon.redirect";
    public static final String CACHE_SEARCH_SUGGEST = "search.suggest";
    public static final String CACHE_LEGAL_PAGE = "legal.page";
    public static final String CACHE_HOMEPAGE_LAYOUT = "homepage.layout";
    public static final String CACHE_SITE_SETTINGS = "site.settings.public";
    public static final String CACHE_ANALYTICS = "analytics.summary";
    public static final String CACHE_CAMPAIGNS_ACTIVE = "campaigns.active";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager mgr = new CaffeineCacheManager(
                CACHE_STORE_DETAIL,
                CACHE_COUPON_DETAIL,
                CACHE_CATEGORY_TREE,
                CACHE_HOMEPAGE_TOP,
                CACHE_REDIRECT,
                CACHE_SEARCH_SUGGEST,
                CACHE_LEGAL_PAGE,
                CACHE_HOMEPAGE_LAYOUT,
                CACHE_SITE_SETTINGS,
                CACHE_ANALYTICS,
                CACHE_CAMPAIGNS_ACTIVE);
        mgr.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(10))
                .maximumSize(10_000)
                .recordStats());
        return mgr;
    }
}
