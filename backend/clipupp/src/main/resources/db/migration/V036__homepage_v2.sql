-- V036: Homepage v2 (spec: docs/superpowers/specs/2026-10-12-homepage-v2-design.md)
-- Numbered 036: a local dev DB already carried uncommitted 034/035 rows; Flyway allows gaps.

-- 1. Admin-set verification timestamp. Drives "Verified 2h ago" on cards.
alter table coupon add column if not exists verified_at timestamptz;
update coupon set verified_at = coalesce(updated_at, created_at) where verified = true and verified_at is null;
create index if not exists idx_coupon_verified_at on coupon (verified_at desc) where verified = true and deleted_at is null;

-- 2. Seven-block layout. New codes inserted, legacy codes disabled (not deleted)
--    so /admin/homepage can re-enable them later.
insert into homepage_section (code, title, subtitle, enabled, position, item_limit)
values
  ('trending_coupons', 'Trending verified coupons', 'Most copied right now', true, 20, 7),
  ('bank_offers',      'Bank offers and festive sales', 'Stack with codes', true, 50, 2),
  ('verify_band',      'Every code is tested before you see it.', 'How we verify', true, 60, null)
on conflict (code) do nothing;

update homepage_section set position = 10, item_limit = null,
  title = 'Working coupon codes for every Indian store.',
  subtitle = 'No wallet, no tracking, no waiting. Just codes that work.'
  where code = 'hero_search';
update homepage_section set position = 30, item_limit = 12, title = 'Top stores', subtitle = '500+ stores' where code = 'featured_stores';
update homepage_section set position = 40, item_limit = 4, title = 'Today''s top coupons', subtitle = 'Updated every hour' where code = 'top_deals';
update homepage_section set position = 70,
  title = 'Best deals, once a week.',
  subtitle = 'The 10 codes worth knowing about. No spam, unsubscribe any time.'
  where code = 'newsletter';

update homepage_section set enabled = false
  where code in ('promo_banners','trending_stores','trusted_brands','savings_stats','daily_picks',
                 'popular_categories','editorial_tips','editorial','guarantees','faq');

-- 3. Bank chip row under the festive tiles. Comma separated, public.
insert into site_setting (key, value)
values ('bank_offers.banks', to_jsonb('HDFC Bank,SBI Card,ICICI Bank,Axis Bank,Kotak'::text))
on conflict (key) do nothing;
