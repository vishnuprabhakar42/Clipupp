package com.clipupp.analytics.application;

import com.clipupp.analytics.api.dto.AnalyticsDtos.FunnelResponse;
import com.clipupp.analytics.api.dto.AnalyticsDtos.NetworkBreakdownRow;
import com.clipupp.analytics.api.dto.AnalyticsDtos.SummaryResponse;
import com.clipupp.analytics.api.dto.AnalyticsDtos.TimeseriesPoint;
import com.clipupp.analytics.api.dto.AnalyticsDtos.TimeseriesResponse;
import com.clipupp.analytics.api.dto.AnalyticsDtos.TopCouponRow;
import com.clipupp.analytics.api.dto.AnalyticsDtos.TopStoreRow;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Analytics aggregator. Reads from materialized views where possible; falls
 * back to live queries on small lookups. Every method is cached for 5 min in
 * the {@code analytics.summary} Caffeine region.
 */
@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    @PersistenceContext
    private EntityManager em;

    // ---- Summary -----------------------------------------------------------

    @Cacheable(cacheNames = "analytics.summary", key = "'summary:' + #days")
    public SummaryResponse summary(int days) {
        int safeDays = clampDays(days);

        long usersTotal = scalarLong("SELECT count(*) FROM app_user WHERE status <> 'DELETED'");
        long signupsInRange = scalarLong(
                "SELECT coalesce(sum(signups),0) FROM mv_signups_daily WHERE day >= current_date - (cast(?1 as integer) - 1)",
                safeDays);
        long clicksInRange = scalarLong(
                "SELECT coalesce(sum(clicks),0) FROM mv_clicks_daily WHERE day >= current_date - (cast(?1 as integer) - 1)",
                safeDays);
        long conversionsInRange = scalarLong(
                "SELECT coalesce(sum(conversions),0) FROM mv_conversions_daily WHERE day >= current_date - (cast(?1 as integer) - 1)",
                safeDays);
        long approvedInRange = scalarLong(
                "SELECT coalesce(sum(conversions),0) FROM mv_conversions_daily WHERE state = 'APPROVED' AND day >= current_date - (cast(?1 as integer) - 1)",
                safeDays);

        // Top earning currency in the range so we don't sum across mixed FX.
        Object[] topCurrencyRow = scalarRow(
                "SELECT currency, sum(commission_total) AS total FROM mv_conversions_daily " +
                "WHERE state = 'APPROVED' AND day >= current_date - (cast(?1 as integer) - 1) " +
                "  AND currency IS NOT NULL " +
                "GROUP BY currency ORDER BY total DESC LIMIT 1",
                safeDays);
        BigDecimal commissionInRange = topCurrencyRow == null
                ? BigDecimal.ZERO
                : (BigDecimal) topCurrencyRow[1];
        String commissionCurrency = topCurrencyRow == null ? "" : (String) topCurrencyRow[0];

        // 24-hour live counts (small queries).
        long signupsToday = scalarLong(
                "SELECT count(*) FROM app_user WHERE created_at >= current_date");
        long clicksToday = scalarLong(
                "SELECT count(*) FROM click WHERE created_at >= current_date");
        long conversionsToday = scalarLong(
                "SELECT count(*) FROM conversion WHERE created_at >= current_date");

        // Top store + top coupon (from the 30d MVs).
        Object[] topStore = scalarRow(
                "SELECT store_name, clicks FROM mv_top_stores_30d ORDER BY clicks DESC LIMIT 1");
        Object[] topCoupon = scalarRow(
                "SELECT coupon_title, clicks FROM mv_top_coupons_30d ORDER BY clicks DESC LIMIT 1");

        return new SummaryResponse(
                safeDays,
                usersTotal,
                signupsInRange,
                clicksInRange,
                conversionsInRange,
                approvedInRange,
                commissionInRange == null ? BigDecimal.ZERO : commissionInRange,
                commissionCurrency,
                signupsToday,
                clicksToday,
                conversionsToday,
                topStore == null ? null : (String) topStore[0],
                topStore == null ? null : ((Number) topStore[1]).longValue(),
                topCoupon == null ? null : (String) topCoupon[0],
                topCoupon == null ? null : ((Number) topCoupon[1]).longValue()
        );
    }

    // ---- Time series -------------------------------------------------------

    @Cacheable(cacheNames = "analytics.summary", key = "'ts:' + #metric + ':' + #days")
    public TimeseriesResponse timeseries(String metric, int days) {
        int safeDays = clampDays(days);
        List<TimeseriesPoint> points = switch (metric) {
            case "clicks" -> bucketed(
                    "SELECT day, sum(clicks) FROM mv_clicks_daily " +
                    "WHERE day >= current_date - (cast(?1 as integer) - 1) GROUP BY day ORDER BY day",
                    safeDays);
            case "conversions" -> bucketed(
                    "SELECT day, sum(conversions) FROM mv_conversions_daily " +
                    "WHERE day >= current_date - (cast(?1 as integer) - 1) GROUP BY day ORDER BY day",
                    safeDays);
            case "signups" -> bucketed(
                    "SELECT day, sum(signups) FROM mv_signups_daily " +
                    "WHERE day >= current_date - (cast(?1 as integer) - 1) GROUP BY day ORDER BY day",
                    safeDays);
            default -> throw new IllegalArgumentException("Unknown metric: " + metric);
        };
        // Backfill missing days with zeroes for charts to look continuous.
        Map<LocalDate, Long> byDay = new HashMap<>();
        for (TimeseriesPoint p : points) byDay.put(p.day(), p.value());
        List<TimeseriesPoint> filled = new ArrayList<>(safeDays);
        LocalDate today = LocalDate.now();
        for (int i = safeDays - 1; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            filled.add(new TimeseriesPoint(d, byDay.getOrDefault(d, 0L)));
        }
        return new TimeseriesResponse(metric, safeDays, filled);
    }

    // ---- Top stores --------------------------------------------------------

    @Cacheable(cacheNames = "analytics.summary", key = "'top-stores:' + #limit")
    @SuppressWarnings("unchecked")
    public List<TopStoreRow> topStores(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        List<Object[]> rows = em.createNativeQuery("""
                SELECT store_id, store_slug, store_name, logo_url, clicks, conversions, commission_total
                FROM mv_top_stores_30d
                WHERE clicks > 0 OR conversions > 0
                ORDER BY clicks DESC, conversions DESC
                LIMIT cast(?1 as integer)
                """)
                .setParameter(1, safeLimit)
                .getResultList();
        List<TopStoreRow> out = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            out.add(new TopStoreRow(
                    String.valueOf(r[0]),
                    (String) r[1],
                    (String) r[2],
                    (String) r[3],
                    ((Number) r[4]).longValue(),
                    ((Number) r[5]).longValue(),
                    r[6] == null ? BigDecimal.ZERO : (BigDecimal) r[6]
            ));
        }
        return out;
    }

    // ---- Top coupons -------------------------------------------------------

    @Cacheable(cacheNames = "analytics.summary", key = "'top-coupons:' + #limit")
    @SuppressWarnings("unchecked")
    public List<TopCouponRow> topCoupons(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        List<Object[]> rows = em.createNativeQuery("""
                SELECT coupon_id, coupon_slug, coupon_title, store_slug, store_name, clicks
                FROM mv_top_coupons_30d
                WHERE clicks > 0
                ORDER BY clicks DESC
                LIMIT cast(?1 as integer)
                """)
                .setParameter(1, safeLimit)
                .getResultList();
        List<TopCouponRow> out = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            out.add(new TopCouponRow(
                    String.valueOf(r[0]),
                    (String) r[1],
                    (String) r[2],
                    (String) r[3],
                    (String) r[4],
                    ((Number) r[5]).longValue()
            ));
        }
        return out;
    }

    // ---- Funnel ------------------------------------------------------------

    @Cacheable(cacheNames = "analytics.summary", key = "'funnel:' + #days")
    public FunnelResponse funnel(int days) {
        int safeDays = clampDays(days);
        long clicks = scalarLong(
                "SELECT coalesce(sum(clicks),0) FROM mv_clicks_daily WHERE day >= current_date - (cast(?1 as integer) - 1)",
                safeDays);
        long convAttempted = scalarLong(
                "SELECT coalesce(sum(conversions),0) FROM mv_conversions_daily WHERE day >= current_date - (cast(?1 as integer) - 1)",
                safeDays);
        long convApproved = scalarLong(
                "SELECT coalesce(sum(conversions),0) FROM mv_conversions_daily WHERE state = 'APPROVED' AND day >= current_date - (cast(?1 as integer) - 1)",
                safeDays);
        Object[] currencyRow = scalarRow(
                "SELECT currency, sum(commission_total) FROM mv_conversions_daily " +
                "WHERE state = 'APPROVED' AND day >= current_date - (cast(?1 as integer) - 1) " +
                "  AND currency IS NOT NULL " +
                "GROUP BY currency ORDER BY 2 DESC LIMIT 1",
                safeDays);
        BigDecimal commission = currencyRow == null ? BigDecimal.ZERO : (BigDecimal) currencyRow[1];
        String currency = currencyRow == null ? "" : (String) currencyRow[0];
        return new FunnelResponse(safeDays, clicks, convAttempted, convApproved,
                commission == null ? BigDecimal.ZERO : commission,
                currency);
    }

    // ---- Network breakdown -------------------------------------------------

    @Cacheable(cacheNames = "analytics.summary", key = "'by-network:' + #days")
    @SuppressWarnings("unchecked")
    public List<NetworkBreakdownRow> byNetwork(int days) {
        int safeDays = clampDays(days);
        List<Object[]> rows = em.createNativeQuery("""
                SELECT n.id, n.code, n.name,
                       coalesce(c.clicks, 0) AS clicks,
                       coalesce(v.conversions, 0) AS conversions,
                       coalesce(v.approved, 0) AS approved,
                       coalesce(v.commission, 0)::numeric(19,4) AS commission
                FROM affiliate_network n
                LEFT JOIN (
                    SELECT network_id, sum(clicks) AS clicks FROM mv_clicks_daily
                    WHERE day >= current_date - (cast(?1 as integer) - 1)
                    GROUP BY network_id
                ) c ON c.network_id = n.id
                LEFT JOIN (
                    SELECT network_id,
                           sum(conversions) AS conversions,
                           sum(case when state = 'APPROVED' then conversions else 0 end) AS approved,
                           sum(case when state = 'APPROVED' then commission_total else 0 end) AS commission
                    FROM mv_conversions_daily
                    WHERE day >= current_date - (cast(?1 as integer) - 1)
                    GROUP BY network_id
                ) v ON v.network_id = n.id
                ORDER BY clicks DESC, n.name ASC
                """)
                .setParameter(1, safeDays)
                .getResultList();
        List<NetworkBreakdownRow> out = new ArrayList<>(rows.size());
        for (Object[] r : rows) {
            out.add(new NetworkBreakdownRow(
                    String.valueOf(r[0]),
                    (String) r[1],
                    (String) r[2],
                    ((Number) r[3]).longValue(),
                    ((Number) r[4]).longValue(),
                    ((Number) r[5]).longValue(),
                    r[6] == null ? BigDecimal.ZERO : (BigDecimal) r[6]
            ));
        }
        return out;
    }

    // ---- helpers -----------------------------------------------------------

    private long scalarLong(String sql, Object... params) {
        Query q = em.createNativeQuery(sql);
        for (int i = 0; i < params.length; i++) q.setParameter(i + 1, params[i]);
        Object v = q.getSingleResult();
        return v == null ? 0L : ((Number) v).longValue();
    }

    private Object[] scalarRow(String sql, Object... params) {
        Query q = em.createNativeQuery(sql);
        for (int i = 0; i < params.length; i++) q.setParameter(i + 1, params[i]);
        @SuppressWarnings("unchecked")
        List<Object[]> rs = q.getResultList();
        return rs.isEmpty() ? null : rs.get(0);
    }

    @SuppressWarnings("unchecked")
    private List<TimeseriesPoint> bucketed(String sql, int days) {
        Query q = em.createNativeQuery(sql).setParameter(1, days);
        List<Object[]> rs = q.getResultList();
        List<TimeseriesPoint> out = new ArrayList<>(rs.size());
        for (Object[] r : rs) {
            LocalDate day = r[0] instanceof Date d
                    ? d.toLocalDate()
                    : LocalDate.parse(r[0].toString());
            long v = r[1] == null ? 0L : ((Number) r[1]).longValue();
            out.add(new TimeseriesPoint(day, v));
        }
        return out;
    }

    private static int clampDays(int d) {
        return Math.max(1, Math.min(d, 365));
    }
}
