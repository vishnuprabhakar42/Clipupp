-- Align the brand colors with the Rakuten-inspired single-purple design
-- system. Previous defaults (accent #ffe05b gold + primary #7c3aed, set in
-- V016) clashed with the brand purple #8529CD now used everywhere else.
-- Idempotent updates.
UPDATE site_setting
SET value = to_jsonb('#8529CD'::text)
WHERE key = 'brand.accent_color';

UPDATE site_setting
SET value = to_jsonb('#8529CD'::text)
WHERE key = 'brand.primary_color';
