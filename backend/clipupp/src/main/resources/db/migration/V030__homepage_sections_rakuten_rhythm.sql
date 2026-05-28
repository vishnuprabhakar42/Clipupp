-- V030: Reorder homepage_section.position to the Rakuten-leaning rhythm.
--
-- Recommended order from the UI revamp plan (~/.claude/plans/dynamic-doodling-falcon.md):
--   hero_search        — top-of-page search hero (LCP candidate)
--   promo_banners      — featured campaign carousel
--   trending_stores    — signed-in personalised rail
--   trusted_brands     — logo-only browse rail
--   savings_stats      — trust strip
--   daily_picks        — editor's picks (1+3 layout)
--   top_deals          — uniform coupon grid
--   popular_categories — category tile grid
--   editorial_tips     — "smart ways to save" tips
--   featured_stores    — editor-pinned store grid
--   editorial          — blog rail
--   guarantees         — trust strip
--   faq                — FAQPage JSON-LD accordion
--   newsletter         — final lead-gen CTA
--
-- (how_it_works is rendered outside SECTION_RENDERERS and isn't in this
-- table.)
--
-- 10-step increments keep room to slot future sections between any two
-- without re-numbering the world.
--
-- Uses UPDATE rather than INSERT so admin-edited copy survives. Any
-- section already disabled via /admin/homepage stays disabled.

UPDATE homepage_section SET position =  10 WHERE code = 'hero_search';
UPDATE homepage_section SET position =  20 WHERE code = 'promo_banners';
UPDATE homepage_section SET position =  30 WHERE code = 'trending_stores';
UPDATE homepage_section SET position =  40 WHERE code = 'trusted_brands';
UPDATE homepage_section SET position =  50 WHERE code = 'savings_stats';
UPDATE homepage_section SET position =  60 WHERE code = 'daily_picks';
UPDATE homepage_section SET position =  70 WHERE code = 'top_deals';
UPDATE homepage_section SET position =  80 WHERE code = 'popular_categories';
UPDATE homepage_section SET position =  90 WHERE code = 'editorial_tips';
UPDATE homepage_section SET position = 100 WHERE code = 'featured_stores';
UPDATE homepage_section SET position = 110 WHERE code = 'editorial';
UPDATE homepage_section SET position = 120 WHERE code = 'guarantees';
UPDATE homepage_section SET position = 130 WHERE code = 'faq';
UPDATE homepage_section SET position = 140 WHERE code = 'newsletter';
