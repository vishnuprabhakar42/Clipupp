-- V034: Homepage v2 (spec: docs/superpowers/specs/2026-10-12-homepage-v2-design.md)

-- 1. Admin-set verification timestamp. Drives "Verified 2h ago" on cards.
alter table coupon add column if not exists verified_at timestamptz;
update coupon set verified_at = coalesce(updated_at, created_at) where verified = true and verified_at is null;
create index if not exists idx_coupon_verified_at on coupon (verified_at desc) where verified = true and deleted_at is null;
