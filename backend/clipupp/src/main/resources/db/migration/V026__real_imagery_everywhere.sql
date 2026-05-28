-- V026: Populate the site with real images. Until now the dev seed only
-- shipped placehold.co URLs that render as solid colour blocks with
-- abbreviated text ("PP", "APL" etc.). This migration replaces those
-- placeholders with real brand assets (Clearbit logo CDN) for stores, and
-- real photos (Unsplash CDN) for authors and blog articles.
--
-- Why these sources, and what about SEO/perf:
--   • Clearbit `logo.clearbit.com/<domain>` returns the brand's actual
--     PNG/SVG logo. Globally CDN-cached, ~5–25 KB per image, no API key
--     needed. If a domain is unknown to Clearbit it 404s and the
--     frontend already falls back to an `alt` text label cleanly.
--   • Unsplash `images.unsplash.com/photo-<id>` is the same source-of-truth
--     URL used in V023/V024; we re-use it because it's HTTP/3 cached at
--     edge and supports server-side resize via query params
--     (`?w=…&h=…&fit=crop&q=75`) so each thumbnail stays ~30–150 KB.
--   • Every URL is `https://`, plain `<img>` (not next/image), so no
--     next.config.mjs allowlist change is required and the SSR HTML
--     ships with correct `<img alt>` for crawlers from the first byte.

-- 1) Stores — derive Clearbit logo URL from each store's primary_url. -----
--    The regex strips the scheme and any `www.` prefix, then takes the
--    host portion before the first `/`. Falls back to the original
--    placeholder if primary_url is malformed.

UPDATE store
SET logo_url = 'https://logo.clearbit.com/' ||
    regexp_replace(primary_url, '^https?://(www\.)?([^/?#]+).*$', '\2') ||
    '?size=256'
WHERE deleted_at IS NULL
  AND logo_url LIKE '%placehold.co%'
  AND primary_url ~ '^https?://[^/]+';


-- 2) Authors — swap the placehold avatar for an Unsplash portrait. ---------
--    Photos are cropped square (256×256) and quality-capped so each avatar
--    is well under 30 KB. URLs are stable and CC0-licensed.

UPDATE author
SET avatar_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&q=75&auto=format'
WHERE name = 'Priya Sharma' AND avatar_url LIKE '%placehold.co%';

UPDATE author
SET avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&q=75&auto=format'
WHERE avatar_url LIKE '%placehold.co%' AND avatar_url LIKE '%text=DM%';

UPDATE author
SET avatar_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&q=75&auto=format'
WHERE avatar_url LIKE '%placehold.co%' AND avatar_url LIKE '%text=RK%';

UPDATE author
SET avatar_url = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=256&h=256&fit=crop&q=75&auto=format'
WHERE avatar_url LIKE '%placehold.co%' AND avatar_url LIKE '%text=NV%';

-- Catch-all fallback for any author still on placehold (uses DiceBear which
-- generates a deterministic illustrated avatar from the name — always 200 OK)
UPDATE author
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' ||
    regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')
WHERE avatar_url LIKE '%placehold.co%';


-- 3) Article hero images — replace placehold with topical Unsplash photos. -

UPDATE article
SET hero_image_url = 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE hero_image_url LIKE '%placehold.co%'
  AND lower(title) LIKE '%save%money%';

UPDATE article
SET hero_image_url = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE hero_image_url LIKE '%placehold.co%'
  AND (lower(title) LIKE '%black friday%' OR lower(title) LIKE '%sale%');

UPDATE article
SET hero_image_url = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE hero_image_url LIKE '%placehold.co%'
  AND lower(title) LIKE '%travel%';

UPDATE article
SET hero_image_url = 'https://images.unsplash.com/photo-1607083206325-caf1edba7a83?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE hero_image_url LIKE '%placehold.co%'
  AND (lower(title) LIKE '%coupon%' OR lower(title) LIKE '%stack%');

-- Catch-all: any remaining placeholder hero falls back to a clean retail photo.
UPDATE article
SET hero_image_url = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE hero_image_url LIKE '%placehold.co%';


-- 4) Banners — any TOP_BAR or PROMO_CARD banner still pointing at the V011
--    placehold solid-colour URLs gets a real Unsplash photo.

UPDATE banner
SET image_url = 'https://images.unsplash.com/photo-1607083206325-caf1edba7a83?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE placement = 'PROMO_CARD' AND image_url LIKE '%placehold.co%';

UPDATE banner
SET image_url = 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1600&h=120&fit=crop&q=70&auto=format'
WHERE placement = 'TOP_BAR' AND image_url LIKE '%placehold.co%';

-- HERO_CAROUSEL banners — match by title so each gets a topical photo.
UPDATE banner SET image_url = 'https://images.unsplash.com/photo-1607083206325-caf1edba7a83?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE image_url LIKE '%placehold.co%' AND title = 'Big Billion Days Are Back';

UPDATE banner SET image_url = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE image_url LIKE '%placehold.co%' AND title = 'Great Indian Festival';

UPDATE banner SET image_url = 'https://images.unsplash.com/photo-1522335789203-aaa1bfc54e22?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE image_url LIKE '%placehold.co%' AND title = 'Nykaa Pink Sale';

UPDATE banner SET image_url = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE image_url LIKE '%placehold.co%' AND title LIKE 'Myntra%';

UPDATE banner SET image_url = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE image_url LIKE '%placehold.co%' AND title LIKE 'Decathlon%';

UPDATE banner SET image_url = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE image_url LIKE '%placehold.co%' AND title LIKE 'MakeMyTrip%';

UPDATE banner SET image_url = 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE image_url LIKE '%placehold.co%' AND title LIKE 'PhonePe%';

UPDATE banner SET image_url = 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE image_url LIKE '%placehold.co%' AND title LIKE 'Samsung%';

-- Final catch-all in case any banner is still on placehold.
UPDATE banner SET image_url = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=600&fit=crop&q=75&auto=format'
WHERE image_url LIKE '%placehold.co%';
