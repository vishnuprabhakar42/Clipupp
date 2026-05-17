-- Phase 5 — Analytics Dashboard.
--
-- Materialised pre-aggregations so the admin dashboard renders without
-- scanning click/conversion tables on every page load. They are refreshed
-- every 15 minutes by AnalyticsRefresher (REFRESH MATERIALIZED VIEW
-- CONCURRENTLY needs a unique index on each view, declared below).
--
-- These views are intentionally small; we keep raw data in click + conversion
-- and only roll up by day. ClickHouse is deferred to Phase 6+ once the daily
-- refresh exceeds ~30 s.

-- ---- 1. Daily clicks per (store, network) -------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_clicks_daily AS
SELECT
    date_trunc('day', created_at AT TIME ZONE 'UTC')::date AS day,
    store_id,
    network_id,
    count(*)::bigint AS clicks
FROM click
GROUP BY 1, 2, 3
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_clicks_daily
    ON mv_clicks_daily (day, store_id, COALESCE(network_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_mv_clicks_daily_day ON mv_clicks_daily (day DESC);

-- ---- 2. Daily conversions per (store, state, currency) ------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_conversions_daily AS
SELECT
    date_trunc('day', c.created_at AT TIME ZONE 'UTC')::date AS day,
    cl.store_id                                              AS store_id,
    c.state                                                  AS state,
    c.network_id                                             AS network_id,
    c.commission_currency                                    AS currency,
    count(*)::bigint                                         AS conversions,
    coalesce(sum(c.commission_amount), 0)::numeric(19, 4)    AS commission_total,
    coalesce(sum(c.order_amount), 0)::numeric(19, 4)         AS order_total
FROM conversion c
LEFT JOIN click cl ON cl.click_id = c.click_id
GROUP BY 1, 2, 3, 4, 5
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_conversions_daily
    ON mv_conversions_daily (
        day,
        COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid),
        state,
        network_id,
        COALESCE(currency, 'XXX')
    );
CREATE INDEX IF NOT EXISTS idx_mv_conv_daily_day ON mv_conversions_daily (day DESC);

-- ---- 3. Daily user signups ----------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_signups_daily AS
SELECT
    date_trunc('day', created_at AT TIME ZONE 'UTC')::date AS day,
    count(*)::bigint AS signups
FROM app_user
GROUP BY 1
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_signups_daily ON mv_signups_daily (day);

-- ---- 4. Top stores in the last 30 days (by clicks + conversions) --------
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_stores_30d AS
SELECT
    s.id                                AS store_id,
    s.slug                              AS store_slug,
    s.name                              AS store_name,
    s.logo_url                          AS logo_url,
    coalesce(cl.clicks, 0)::bigint      AS clicks,
    coalesce(cv.conversions, 0)::bigint AS conversions,
    coalesce(cv.commission_total, 0)::numeric(19, 4) AS commission_total
FROM store s
LEFT JOIN (
    SELECT store_id, count(*)::bigint AS clicks
    FROM click
    WHERE created_at >= now() - interval '30 days'
    GROUP BY 1
) cl ON cl.store_id = s.id
LEFT JOIN (
    SELECT cl.store_id,
           count(*)::bigint AS conversions,
           coalesce(sum(c.commission_amount), 0)::numeric(19, 4) AS commission_total
    FROM conversion c
    LEFT JOIN click cl ON cl.click_id = c.click_id
    WHERE c.created_at >= now() - interval '30 days'
    GROUP BY 1
) cv ON cv.store_id = s.id
WHERE s.deleted_at IS NULL
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_top_stores_30d ON mv_top_stores_30d (store_id);
CREATE INDEX IF NOT EXISTS idx_mv_top_stores_30d_clicks
    ON mv_top_stores_30d (clicks DESC);

-- ---- 5. Top coupons in the last 30 days (by clicks) ---------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_coupons_30d AS
SELECT
    c.id                              AS coupon_id,
    c.slug                            AS coupon_slug,
    c.title                           AS coupon_title,
    c.store_id                        AS store_id,
    s.name                            AS store_name,
    s.slug                            AS store_slug,
    coalesce(cl.clicks, 0)::bigint    AS clicks
FROM coupon c
JOIN store s ON s.id = c.store_id
LEFT JOIN (
    SELECT coupon_id, count(*)::bigint AS clicks
    FROM click
    WHERE created_at >= now() - interval '30 days'
    GROUP BY 1
) cl ON cl.coupon_id = c.id
WHERE c.deleted_at IS NULL
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mv_top_coupons_30d ON mv_top_coupons_30d (coupon_id);
CREATE INDEX IF NOT EXISTS idx_mv_top_coupons_30d_clicks
    ON mv_top_coupons_30d (clicks DESC);

-- ---- 6. Initial refresh (non-CONCURRENTLY since views start empty) ------
REFRESH MATERIALIZED VIEW mv_clicks_daily;
REFRESH MATERIALIZED VIEW mv_conversions_daily;
REFRESH MATERIALIZED VIEW mv_signups_daily;
REFRESH MATERIALIZED VIEW mv_top_stores_30d;
REFRESH MATERIALIZED VIEW mv_top_coupons_30d;
