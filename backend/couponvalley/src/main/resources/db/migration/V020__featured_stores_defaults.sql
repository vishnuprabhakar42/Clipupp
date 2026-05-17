-- Tune the Featured Stores section for the new bento-layout grid. The new
-- design renders 1 hero card spanning 2×2 + 8 standard cards (9 total),
-- and the subtitle becomes part of the editorial header.
UPDATE homepage_section
SET item_limit = 9,
    subtitle   = 'Hand-picked stores with the biggest cashback this week'
WHERE code = 'featured_stores'
  AND (subtitle IS NULL OR subtitle = '');
