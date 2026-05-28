-- ===========================================================================
-- V031 — Rebrand: Clipupp → ClipUpp
--
-- The rebrand sweep updated the seed *files* for V011, V014, V016, V022..V025,
-- V029, and R__seed_dev_data.sql. Versioned migrations run exactly once per
-- version, and the rebranded files were re-checksummed via flyway.repair() —
-- so the new copy lives on disk but the *rows already in the database* still
-- carry the old "Clipupp" / "clipupp" strings.
--
-- This migration UPDATEs those rows in place. Idempotent: re-running against
-- already-rebranded data is a no-op (WHERE LIKE guards skip every row).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. site_setting — JSONB values from V016
-- ---------------------------------------------------------------------------
UPDATE site_setting
SET value = to_jsonb(replace(value #>> '{}', 'Clipupp', 'ClipUpp'))
WHERE jsonb_typeof(value) = 'string'
  AND value::text LIKE '%Clipupp%';

UPDATE site_setting
SET value = to_jsonb(replace(value #>> '{}', 'clipupp', 'clipupp'))
WHERE jsonb_typeof(value) = 'string'
  AND value::text LIKE '%clipupp%';

-- ---------------------------------------------------------------------------
-- 2. banner — title / subtitle / link_url
-- ---------------------------------------------------------------------------
UPDATE banner
SET title = replace(title, 'Clipupp', 'ClipUpp')
WHERE title LIKE '%Clipupp%';

UPDATE banner
SET subtitle = replace(subtitle, 'Clipupp', 'ClipUpp')
WHERE subtitle LIKE '%Clipupp%';

UPDATE banner
SET link_url = replace(link_url, 'clipupp', 'clipupp')
WHERE link_url LIKE '%clipupp%';

-- ---------------------------------------------------------------------------
-- 3. legal_page — title / body_md / meta_title / meta_description (V014)
-- ---------------------------------------------------------------------------
UPDATE legal_page
SET title            = replace(title,            'Clipupp', 'ClipUpp'),
    body_md          = replace(body_md,          'Clipupp', 'ClipUpp'),
    meta_title       = replace(meta_title,       'Clipupp', 'ClipUpp'),
    meta_description = replace(meta_description, 'Clipupp', 'ClipUpp')
WHERE title            LIKE '%Clipupp%'
   OR body_md          LIKE '%Clipupp%'
   OR meta_title       LIKE '%Clipupp%'
   OR meta_description LIKE '%Clipupp%';

UPDATE legal_page
SET body_md = replace(body_md, 'clipupp', 'clipupp')
WHERE body_md LIKE '%clipupp%';

-- ---------------------------------------------------------------------------
-- 4. article (blog posts) — title / excerpt / body_md / slug / meta_* (V009)
-- ---------------------------------------------------------------------------
UPDATE article
SET title            = replace(title,            'Clipupp', 'ClipUpp'),
    excerpt          = replace(excerpt,          'Clipupp', 'ClipUpp'),
    body_md          = replace(body_md,          'Clipupp', 'ClipUpp'),
    meta_title       = replace(meta_title,       'Clipupp', 'ClipUpp'),
    meta_description = replace(meta_description, 'Clipupp', 'ClipUpp')
WHERE title            LIKE '%Clipupp%'
   OR excerpt          LIKE '%Clipupp%'
   OR body_md          LIKE '%Clipupp%'
   OR meta_title       LIKE '%Clipupp%'
   OR meta_description LIKE '%Clipupp%';

-- Slug rename is unique-constrained. The R__seed_dev_data.sql repeatable
-- migration re-ran after the rebrand edit and inserted the ClipUpp-slugged
-- rows (e.g. 'how-cashback-works-clipupp'); the original Clipupp-slugged
-- rows from the pre-rebrand seed are still in the table. Renaming the old
-- slug → new would collide with the unique constraint, so drop the orphan
-- old rows first when their rebranded target already exists.
DELETE FROM article a1
WHERE a1.slug LIKE '%clipupp%'
  AND EXISTS (
    SELECT 1 FROM article a2
    WHERE a2.slug = replace(a1.slug, 'clipupp', 'clipupp')
  );

-- Now safe to rename any remaining clipupp-slugged articles.
UPDATE article
SET slug = replace(slug, 'clipupp', 'clipupp')
WHERE slug LIKE '%clipupp%';

-- body_md is plain text — no unique constraint, safe to rewrite separately.
UPDATE article
SET body_md = replace(body_md, 'clipupp', 'clipupp')
WHERE body_md LIKE '%clipupp%';

-- ---------------------------------------------------------------------------
-- 5. campaign — name / hero_title / hero_subtitle / cta_label / cta_url
-- ---------------------------------------------------------------------------
UPDATE campaign
SET name          = replace(name,          'Clipupp', 'ClipUpp'),
    hero_title    = replace(hero_title,    'Clipupp', 'ClipUpp'),
    hero_subtitle = replace(hero_subtitle, 'Clipupp', 'ClipUpp'),
    cta_label     = replace(cta_label,     'Clipupp', 'ClipUpp'),
    description   = replace(description,   'Clipupp', 'ClipUpp')
WHERE name          LIKE '%Clipupp%'
   OR hero_title    LIKE '%Clipupp%'
   OR hero_subtitle LIKE '%Clipupp%'
   OR cta_label     LIKE '%Clipupp%'
   OR description   LIKE '%Clipupp%';

UPDATE campaign
SET cta_url = replace(cta_url, 'clipupp', 'clipupp')
WHERE cta_url LIKE '%clipupp%';

-- ---------------------------------------------------------------------------
-- 6. homepage_section — title / subtitle (V015, V029)
-- ---------------------------------------------------------------------------
UPDATE homepage_section
SET title    = replace(title,    'Clipupp', 'ClipUpp'),
    subtitle = replace(subtitle, 'Clipupp', 'ClipUpp')
WHERE title    LIKE '%Clipupp%'
   OR subtitle LIKE '%Clipupp%';

-- ---------------------------------------------------------------------------
-- 7. store — content fields that may have been seeded with brand text
-- ---------------------------------------------------------------------------
UPDATE store
SET short_description = replace(short_description, 'Clipupp', 'ClipUpp'),
    description       = replace(description,       'Clipupp', 'ClipUpp')
WHERE short_description LIKE '%Clipupp%'
   OR description       LIKE '%Clipupp%';
