-- Phase 7 — Performance audit. Most hot-path indexes were created in earlier
-- migrations (V004 store, V005 coupon, V007 click/conversion, V015 featured,
-- V017 analytics MVs). This migration only fills the small gaps the audit
-- surfaced; everything else uses IF NOT EXISTS so it's a safe no-op if the
-- index already happens to exist on a hand-tuned environment.

-- Active-coupon lookups by expiry — used by store-detail pages and the
-- "active deals" filter. Partial so the index stays small (deleted rows excluded).
CREATE INDEX IF NOT EXISTS ix_coupon_status_expires
    ON coupon (status, expires_at)
    WHERE deleted_at IS NULL;

-- Per-store coupon lists ordered by popularity. Without this, the listForStore
-- query plan does a sort on the joined table.
CREATE INDEX IF NOT EXISTS ix_coupon_store_status_popularity
    ON coupon (store_id, status, popularity_score DESC)
    WHERE deleted_at IS NULL;

-- Daily-signup time-series (analytics MV scans this; live dashboard "today"
-- count uses it directly).
CREATE INDEX IF NOT EXISTS ix_app_user_created
    ON app_user (created_at DESC);
