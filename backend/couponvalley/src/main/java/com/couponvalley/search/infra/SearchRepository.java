package com.couponvalley.search.infra;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Repository;

/**
 * Postgres FTS-backed search. Constructs queries safely (parameter binding,
 * no string concat with the user query) and falls back to {@code pg_trgm}
 * similarity when {@code plainto_tsquery} returns nothing — typical for
 * single-word typos.
 */
@Repository
public class SearchRepository {

    @PersistenceContext
    private EntityManager em;

    public List<SearchHit> searchStores(String query, String countryCode, int limit) {
        if (query == null || query.isBlank()) return Collections.emptyList();
        String sql = """
            select s.id::text, s.slug, s.name as title, s.short_description as snippet,
                   s.logo_url as image_url, 'STORE'::text as kind,
                   ts_rank(s.search_tsv, plainto_tsquery('english', :q)) as rank
              from store s
              where s.deleted_at is null
                and s.status = 'ACTIVE'
                and (cast(:country as text) is null or s.country_code = :country)
                and (s.search_tsv @@ plainto_tsquery('english', :q)
                     or similarity(s.name, :q) > 0.25)
              order by rank desc, similarity(s.name, :q) desc
              limit :lim
            """;
        return runHitQuery(sql, query, countryCode, limit);
    }

    public List<SearchHit> searchCoupons(String query, int limit) {
        if (query == null || query.isBlank()) return Collections.emptyList();
        String sql = """
            select c.id::text, c.slug, c.title, c.savings_label as snippet,
                   null::text as image_url, 'COUPON'::text as kind,
                   ts_rank(c.search_tsv, plainto_tsquery('english', :q)) as rank
              from coupon c
              where c.deleted_at is null
                and c.status = 'ACTIVE'
                and (c.expires_at is null or c.expires_at > now())
                and (c.search_tsv @@ plainto_tsquery('english', :q)
                     or similarity(c.title, :q) > 0.25)
              order by rank desc, c.popularity_score desc
              limit :lim
            """;
        return runHitQuery(sql, query, null, limit);
    }

    public List<SearchHit> searchCategories(String query, int limit) {
        if (query == null || query.isBlank()) return Collections.emptyList();
        String sql = """
            select c.id::text, c.slug, c.title, c.description as snippet,
                   null::text as image_url, 'CATEGORY'::text as kind,
                   similarity(c.title, :q) as rank
              from category c
              where c.active = true
                and similarity(c.title, :q) > 0.2
              order by rank desc
              limit :lim
            """;
        return runHitQuery(sql, query, null, limit);
    }

    @SuppressWarnings("unchecked")
    private List<SearchHit> runHitQuery(String sql, String query, String country, int limit) {
        var q = em.createNativeQuery(sql);
        q.setParameter("q", query);
        if (sql.contains(":country")) q.setParameter("country", country);
        q.setParameter("lim", limit);
        List<Object[]> rows = (List<Object[]>) q.getResultList();
        List<SearchHit> hits = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            hits.add(new SearchHit(
                    (String) r[0],
                    (String) r[1],
                    (String) r[2],
                    (String) r[3],
                    (String) r[4],
                    (String) r[5],
                    r[6] == null ? 0d : ((Number) r[6]).doubleValue()));
        }
        return hits;
    }

    public record SearchHit(String id, String slug, String title, String snippet,
                            String imageUrl, String kind, double rank) {}
}
