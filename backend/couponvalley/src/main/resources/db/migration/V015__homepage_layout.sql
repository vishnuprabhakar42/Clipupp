-- Phase 3 — Homepage Layout CMS.
--
-- Each section that the public home page renders gets a row in
-- `homepage_section`. The frontend keeps the section-component mapping
-- (it's code, not data — admins shouldn't be able to invent new section
-- types), but the admin can:
--   * reorder sections (drag in /admin/homepage)
--   * toggle each one on/off
--   * change the title/subtitle that renders above the rail
--   * change the item limit
--   * stash arbitrary per-section options in `config` (jsonb)

create table if not exists homepage_section (
    id           uuid primary key default gen_random_uuid(),
    code         text not null unique,
    title        text not null,
    subtitle     text,
    enabled      boolean not null default true,
    position     integer not null,
    item_limit   integer,
    config       jsonb not null default '{}'::jsonb,
    updated_at   timestamptz not null default now(),
    updated_by   uuid
);

create index idx_homepage_section_position on homepage_section(position);

-- Seed the seven sections rendered today by `app/[locale]/(public)/page.tsx`.
-- The codes match the public component identifiers; the frontend resolves
-- code → component, so adding a new code here without a matching component
-- is a no-op (safe).
insert into homepage_section (code, title, subtitle, enabled, position, item_limit) values
('trending_stores',     'Your favorites & visited',  null,                                        true, 10, 12),
('promo_banners',       'Promo banners',             null,                                        true, 20, null),
('featured_stores',     'Featured Stores',           null,                                        true, 30, 18),
('top_deals',           'Top deals',                 'Verified codes — refreshed daily',          true, 40, 10),
('editorial',           'The Real Deal',             'Buying guides + product reviews',           true, 50, 4),
('popular_categories',  'Shop by category',          null,                                        true, 60, null),
('newsletter',          'Get the weekly digest',     'One email a week. Unsubscribe any time.',   true, 70, null);

-- Featured ordering for stores (the `is_featured` flag already exists from V012;
-- we just need a stable ordering for the admin's drag-reorder).
alter table store
    add column if not exists featured_position integer;

create index if not exists idx_store_featured_position on store(featured_position)
    where is_featured = true and deleted_at is null;

-- Coupons: add featured + featured_position so admins can pin specific deals
-- to the "Top deals" section regardless of popularity_score.
alter table coupon
    add column if not exists is_featured boolean not null default false,
    add column if not exists featured_position integer;

create index if not exists idx_coupon_featured on coupon(is_featured, featured_position)
    where is_featured = true and deleted_at is null and status = 'ACTIVE';

-- Categories: featured determines whether it appears in "Popular categories".
alter table category
    add column if not exists is_featured boolean not null default false,
    add column if not exists featured_position integer;

create index if not exists idx_category_featured on category(is_featured, featured_position)
    where is_featured = true and active = true;
