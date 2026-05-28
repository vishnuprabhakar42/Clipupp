-- Phase 6 — Campaigns / "live events".
--
-- A campaign is a time-bounded promo: a slug, hero copy, optional theme
-- color override, optional pinned stores/coupons, and an optional banner ref.
-- Frontend resolves the currently-active campaign once and overlays its
-- copy onto the announcement bar / hero.

create table if not exists campaign (
    id                  uuid primary key default gen_random_uuid(),
    slug                text not null unique,
    name                text not null,
    description         text,
    starts_at           timestamptz not null,
    ends_at             timestamptz not null,
    active              boolean not null default true,
    -- Visual / hero ----------------------------------------------------
    hero_title          text,
    hero_subtitle       text,
    hero_image_url      text,
    cta_label           text,
    cta_url             text,
    theme_color         text,                              -- e.g. #7c3aed
    banner_id           uuid references banner(id) on delete set null,
    -- Pinned content (replaces homepage defaults during the run) -------
    pinned_store_ids    uuid[] not null default '{}',
    pinned_coupon_ids   uuid[] not null default '{}',
    -- Audit ------------------------------------------------------------
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    created_by          uuid,
    updated_by          uuid
);

create index if not exists idx_campaign_window
    on campaign (starts_at, ends_at)
    where active = true;
