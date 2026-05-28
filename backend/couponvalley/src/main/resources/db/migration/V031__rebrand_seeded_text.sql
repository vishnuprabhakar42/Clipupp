-- ===========================================================================
-- V031 — Rebrand: Coupon Valley → ClipUpp
--
-- The rebrand sweep updated the seed *files* for V011, V014, V016, V022..V025,
-- V029, and R__seed_dev_data.sql. Versioned migrations run exactly once per
-- version, and the rebranded files were re-checksummed via flyway.repair() —
-- so the new copy lives on disk but the *rows already in the database* still
-- carry the old "CouponValley" / "couponvalley" strings.
--
-- This migration UPDATEs those rows in place. Idempotent: re-running against
-- already-rebranded data is a no-op (WHERE LIKE guards skip every row).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. site_setting — JSONB values from V016
-- ---------------------------------------------------------------------------
UPDATE site_setting
SET value = to_jsonb(replace(value #>> '{}', 'CouponValley', 'ClipUpp'))
WHERE jsonb_typeof(value) = 'string'
  AND value::text LIKE '%CouponValley%';

UPDATE site_setting
SET value = to_jsonb(replace(value #>> '{}', 'couponvalley', 'clipupp'))
WHERE jsonb_typeof(value) = 'string'
  AND value::text LIKE '%couponvalley%';

-- ---------------------------------------------------------------------------
-- 2. banner — title / subtitle / link_url
-- ---------------------------------------------------------------------------
UPDATE banner
SET title = replace(title, 'CouponValley', 'ClipUpp')
WHERE title LIKE '%CouponValley%';

UPDATE banner
SET subtitle = replace(subtitle, 'CouponValley', 'ClipUpp')
WHERE subtitle LIKE '%CouponValley%';

UPDATE banner
SET link_url = replace(link_url, 'couponvalley', 'clipupp')
WHERE link_url LIKE '%couponvalley%';

-- ---------------------------------------------------------------------------
-- 3. legal_page — title / body_md / meta_title / meta_description (V014)
-- ---------------------------------------------------------------------------
UPDATE legal_page
SET title            = replace(title,            'CouponValley', 'ClipUpp'),
    body_md          = replace(body_md,          'CouponValley', 'ClipUpp'),
    meta_title       = replace(meta_title,       'CouponValley', 'ClipUpp'),
    meta_description = replace(meta_description, 'CouponValley', 'ClipUpp')
WHERE title            LIKE '%CouponValley%'
   OR body_md          LIKE '%CouponValley%'
   OR meta_title       LIKE '%CouponValley%'
   OR meta_description LIKE '%CouponValley%';

UPDATE legal_page
SET body_md = replace(body_md, 'couponvalley', 'clipupp')
WHERE body_md LIKE '%couponvalley%';

-- ---------------------------------------------------------------------------
-- 4. article (blog posts) — title / excerpt / body_md / slug / meta_* (V009)
-- ---------------------------------------------------------------------------
UPDATE article
SET title            = replace(title,            'CouponValley', 'ClipUpp'),
    excerpt          = replace(excerpt,          'CouponValley', 'ClipUpp'),
    body_md          = replace(body_md,          'CouponValley', 'ClipUpp'),
    meta_title       = replace(meta_title,       'CouponValley', 'ClipUpp'),
    meta_description = replace(meta_description, 'CouponValley', 'ClipUpp')
WHERE title            LIKE '%CouponValley%'
   OR excerpt          LIKE '%CouponValley%'
   OR body_md          LIKE '%CouponValley%'
   OR meta_title       LIKE '%CouponValley%'
   OR meta_description LIKE '%CouponValley%';

UPDATE article
SET slug    = replace(slug,    'couponvalley', 'clipupp'),
    body_md = replace(body_md, 'couponvalley', 'clipupp')
WHERE slug LIKE '%couponvalley%' OR body_md LIKE '%couponvalley%';

-- ---------------------------------------------------------------------------
-- 5. campaign — name / hero_title / hero_subtitle / cta_label / cta_url
-- ---------------------------------------------------------------------------
UPDATE campaign
SET name          = replace(name,          'CouponValley', 'ClipUpp'),
    hero_title    = replace(hero_title,    'CouponValley', 'ClipUpp'),
    hero_subtitle = replace(hero_subtitle, 'CouponValley', 'ClipUpp'),
    cta_label     = replace(cta_label,     'CouponValley', 'ClipUpp'),
    description   = replace(description,   'CouponValley', 'ClipUpp')
WHERE name          LIKE '%CouponValley%'
   OR hero_title    LIKE '%CouponValley%'
   OR hero_subtitle LIKE '%CouponValley%'
   OR cta_label     LIKE '%CouponValley%'
   OR description   LIKE '%CouponValley%';

UPDATE campaign
SET cta_url = replace(cta_url, 'couponvalley', 'clipupp')
WHERE cta_url LIKE '%couponvalley%';

-- ---------------------------------------------------------------------------
-- 6. homepage_section — title / subtitle (V015, V029)
-- ---------------------------------------------------------------------------
UPDATE homepage_section
SET title    = replace(title,    'CouponValley', 'ClipUpp'),
    subtitle = replace(subtitle, 'CouponValley', 'ClipUpp')
WHERE title    LIKE '%CouponValley%'
   OR subtitle LIKE '%CouponValley%';

-- ---------------------------------------------------------------------------
-- 7. store — content fields that may have been seeded with brand text
-- ---------------------------------------------------------------------------
UPDATE store
SET short_description = replace(short_description, 'CouponValley', 'ClipUpp'),
    description       = replace(description,       'CouponValley', 'ClipUpp')
WHERE short_description LIKE '%CouponValley%'
   OR description       LIKE '%CouponValley%';
