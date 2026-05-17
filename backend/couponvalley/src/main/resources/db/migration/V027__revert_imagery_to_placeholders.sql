-- V027: Revert V026. The Clearbit / Unsplash / DiceBear URLs aren't rendering
-- reliably in the user's browser. Restore the previous placehold.co URLs —
-- they at least display as branded colour tiles with an abbreviation, which
-- is the look the user wants to keep until we have a better image pipeline.
--
-- This migration is conditional on the row currently using the V026 URLs so
-- admin-edited rows (and any later real-photo additions) are preserved.

-- 1) Stores — reset Clearbit URLs back to the original placehold pattern.
UPDATE store
SET logo_url = 'https://placehold.co/200x200/' ||
    REPLACE(COALESCE(brand_color, '#1f2937'), '#', '') ||
    '/FFFFFF?text=' || upper(substring(slug, 1, 3))
WHERE deleted_at IS NULL
  AND logo_url LIKE 'https://logo.clearbit.com/%';

-- 2) Authors — reset DiceBear/Unsplash URLs back to placehold initials.
UPDATE author
SET avatar_url = 'https://placehold.co/200x200/9CA3AF/FFFFFF?text=' ||
    upper(substring(regexp_replace(name, '[^A-Za-z ]', '', 'g'), 1, 1)) ||
    COALESCE(
      upper(substring(split_part(name, ' ', 2), 1, 1)),
      ''
    )
WHERE avatar_url LIKE 'https://api.dicebear.com/%'
   OR avatar_url LIKE 'https://images.unsplash.com/%';

-- 3) Articles — reset hero images back to a generic placehold.
UPDATE article
SET hero_image_url = 'https://placehold.co/1200x500/4F46E5/FFFFFF?text=Article'
WHERE hero_image_url LIKE 'https://images.unsplash.com/%';

-- 4) Banners — V024 already replaced placehold with Unsplash for promo
--    banners; restore the original V011 colour-tile defaults.
UPDATE banner
SET image_url = 'https://placehold.co/1200x500/4F46E5/FFFFFF?text=' ||
    REPLACE(REPLACE(title, ' ', '+'), '&', 'and')
WHERE image_url LIKE 'https://images.unsplash.com/%';
