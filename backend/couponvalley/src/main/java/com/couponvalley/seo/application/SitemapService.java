package com.couponvalley.seo.application;

import com.couponvalley.categories.infra.CategoryRepository;
import com.couponvalley.common.error.ApiException;
import com.couponvalley.coupons.infra.CouponRepository;
import com.couponvalley.stores.infra.StoreRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Builds sitemap XML inline from a few cheap projections. Uses native queries
 * to project only (slug, updated_at) — Hibernate-managed entity loads here
 * would be wasteful at scale.
 */
@Service
public class SitemapService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final EntityManager em;
    private final String publicSiteUrl;
    private final String selfBaseUrl;

    public SitemapService(EntityManager em,
                          StoreRepository storeRepo,            // dependency markers — actual queries go through em
                          CouponRepository couponRepo,
                          CategoryRepository categoryRepo,
                          @Value("${couponvalley.public-site-url:http://localhost:3000}") String publicSiteUrl,
                          @Value("${couponvalley.api-base-url:http://localhost:8080}") String selfBaseUrl) {
        this.em = em;
        this.publicSiteUrl = trimTrailingSlash(publicSiteUrl);
        this.selfBaseUrl = trimTrailingSlash(selfBaseUrl);
    }

    public String renderIndex() {
        OffsetDateTime now = OffsetDateTime.now();
        StringBuilder out = new StringBuilder(800);
        out.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        out.append("<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        for (String section : List.of("stores", "coupons", "categories")) {
            out.append("  <sitemap>\n")
               .append("    <loc>").append(escape(selfBaseUrl)).append("/sitemaps/").append(section).append(".xml</loc>\n")
               .append("    <lastmod>").append(now.format(ISO)).append("</lastmod>\n")
               .append("  </sitemap>\n");
        }
        out.append("</sitemapindex>\n");
        return out.toString();
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public String renderSection(String type) {
        return switch (type) {
            case "stores" -> renderUrls(
                    em.createNativeQuery("""
                        select slug, updated_at, 'weekly', 0.7 from store
                        where deleted_at is null and status = 'ACTIVE'
                        order by popularity_score desc, name asc
                        limit 50000
                        """).getResultList(),
                    "/stores/");
            case "coupons" -> renderUrls(
                    em.createNativeQuery("""
                        select slug, updated_at, 'daily', 0.6 from coupon
                        where deleted_at is null and status = 'ACTIVE'
                          and (expires_at is null or expires_at > now())
                        order by popularity_score desc
                        limit 50000
                        """).getResultList(),
                    "/coupons/");
            case "categories" -> renderUrls(
                    em.createNativeQuery("""
                        select slug, updated_at, 'weekly', 0.5 from category
                        where active = true
                        order by position, title
                        """).getResultList(),
                    "/categories/");
            default -> throw ApiException.notFound("Unknown sitemap section");
        };
    }

    private String renderUrls(List<Object[]> rows, String prefix) {
        StringBuilder out = new StringBuilder(64 + rows.size() * 200);
        out.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        out.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" ")
           .append("xmlns:xhtml=\"http://www.w3.org/1999/xhtml\">\n");
        for (Object[] row : rows) {
            String slug = (String) row[0];
            OffsetDateTime lastmod = ((java.sql.Timestamp) row[1]).toInstant().atOffset(java.time.ZoneOffset.UTC);
            String changefreq = (String) row[2];
            double priority = ((Number) row[3]).doubleValue();
            String url = publicSiteUrl + prefix + slug;
            String hiUrl = publicSiteUrl + "/hi" + prefix + slug;
            out.append("  <url>\n")
               .append("    <loc>").append(escape(url)).append("</loc>\n")
               .append("    <lastmod>").append(lastmod.format(ISO)).append("</lastmod>\n")
               .append("    <changefreq>").append(changefreq).append("</changefreq>\n")
               .append("    <priority>").append(priority).append("</priority>\n")
               .append("    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"").append(escape(url)).append("\"/>\n")
               .append("    <xhtml:link rel=\"alternate\" hreflang=\"hi\" href=\"").append(escape(hiUrl)).append("\"/>\n")
               .append("    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"").append(escape(url)).append("\"/>\n")
               .append("  </url>\n");
        }
        out.append("</urlset>\n");
        return out.toString();
    }

    public String renderRobots() {
        return """
               User-agent: *
               Allow: /
               Disallow: /admin/
               Disallow: /account/
               Disallow: /api/
               Disallow: /r/
               Disallow: /og/
               Disallow: /search
               Disallow: /verify-email
               Disallow: /reset-password

               Sitemap: %s/sitemap.xml
               """.formatted(selfBaseUrl);
    }

    private static String escape(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isEmpty()) return "";
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
