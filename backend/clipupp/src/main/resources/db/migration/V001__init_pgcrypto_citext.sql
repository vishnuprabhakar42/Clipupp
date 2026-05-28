-- V001: PostgreSQL extensions and shared helpers required by every later
-- migration. Business tables land in V002 (Sprint 1: auth) and beyond.

-- gen_random_uuid() and pgp_sym_encrypt/decrypt for PII at rest.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- citext (case-insensitive text) for email columns and other identifiers
-- where case must not matter for equality.
CREATE EXTENSION IF NOT EXISTS citext;

-- pg_trgm for fuzzy / typo-tolerant search (used alongside tsvector in Sprint 2).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- A schema-level marker row so we can sanity-check that V001 ran successfully
-- via a simple SELECT in dev. Uses a dedicated table to avoid touching
-- flyway_schema_history.
CREATE TABLE IF NOT EXISTS platform_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO platform_meta(key, value)
VALUES ('schema.bootstrap', 'v001'),
       ('extensions.installed', 'pgcrypto,citext,pg_trgm')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
