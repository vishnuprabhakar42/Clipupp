package com.clipupp.common.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

/**
 * Adds {@code ETag} headers (and 304 short-circuiting) to public read
 * endpoints. The filter buffers each response, hashes it, and returns 304 when
 * the client supplies the same {@code If-None-Match}. Combined with backend
 * Caffeine caches this lets warm clients skip the JSON body entirely on a
 * page reload.
 *
 * Scoped only to public catalog routes. Admin endpoints are left alone (they
 * mutate frequently and the dashboard would just cache-miss).
 */
@Configuration
public class HttpCachingConfig {

    @Bean
    public FilterRegistrationBean<ShallowEtagHeaderFilter> etagFilter() {
        FilterRegistrationBean<ShallowEtagHeaderFilter> bean =
                new FilterRegistrationBean<>(new ShallowEtagHeaderFilter());
        bean.addUrlPatterns(
                "/api/v1/stores/*",
                "/api/v1/coupons/*",
                "/api/v1/offers/*",
                "/api/v1/categories/*",
                "/api/v1/blog/*",
                "/api/v1/banners/*",
                "/api/v1/homepage",
                "/api/v1/homepage/*",
                "/api/v1/legal-pages/*",
                "/api/v1/settings/public",
                "/api/v1/campaigns/*"
        );
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE + 50);
        bean.setName("publicEtagFilter");
        return bean;
    }
}
