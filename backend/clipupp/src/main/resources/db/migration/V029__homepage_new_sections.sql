-- V029: Six additional homepage sections.
--
-- Each section gets a row in `homepage_section` so admins can re-order,
-- toggle, and edit copy via /admin/homepage. The frontend resolves each
-- `code` to a component in `app/[locale]/(public)/page.tsx`
-- (SECTION_RENDERERS map).
--
-- Position values slot the new sections between the existing ones:
--   1  hero_search      (NEW — top-of-page search)
--   5  promo_banners
--   7  savings_stats    (NEW — numeric trust strip)
--   10 trending_stores
--   15 trusted_brands
--   30 featured_stores
--   35 daily_picks      (NEW — editor's-picks 1+3 layout)
--   40 top_deals
--   50 editorial
--   55 editorial_tips   (NEW — "smart ways to save" 4-tile)
--   60 popular_categories
--   65 guarantees       (NEW — 4-up trust strip)
--   70 newsletter
--   75 faq              (NEW — FAQ accordion with FAQPage JSON-LD)
--
-- `ON CONFLICT (code) DO NOTHING` keeps re-runs safe: existing rows are
-- preserved with any admin-edited copy intact.

INSERT INTO homepage_section (code, title, subtitle, enabled, position, item_limit) VALUES
  ('hero_search',
   'Find a coupon for any store',
   'Search thousands of verified coupons and deals from the brands you love. Updated daily by our editorial team.',
   TRUE, 1, NULL),

  ('savings_stats',
   'Real numbers from real shoppers',
   'Live counts from our coupon catalog and partner network — refreshed every hour.',
   TRUE, 7, 4),

  ('daily_picks',
   'Today''s editor''s picks',
   'Four hand-curated deals our team is excited about today. Refreshed every morning.',
   TRUE, 35, 4),

  ('editorial_tips',
   'Smart ways to save more on every order',
   'Tactics from our editorial team for stretching every rupee further — without the work.',
   TRUE, 55, 4),

  ('guarantees',
   'Why shoppers choose ClipUpp',
   NULL,
   TRUE, 65, 4),

  ('faq',
   'Frequently asked questions',
   'Everything you need to know about saving with ClipUpp. Still stuck? Drop us a line — humans answer.',
   TRUE, 75, NULL)
ON CONFLICT (code) DO NOTHING;

-- Seed default site_setting rows for the savings_stats tiles so the section
-- never renders empty. Admins can edit each value at /admin/settings.
-- Values are jsonb (per V016 schema); use to_jsonb(text) to coerce.
INSERT INTO site_setting (key, value) VALUES
  ('stats.coupons',  to_jsonb('10,000+'::text)),
  ('stats.stores',   to_jsonb('500+'::text)),
  ('stats.verified', to_jsonb('97%'::text)),
  ('stats.savings',  to_jsonb('₹1,200'::text))
ON CONFLICT (key) DO NOTHING;
