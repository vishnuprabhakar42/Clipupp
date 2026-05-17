-- V002: core users + auth schema. Owns identity, RBAC, refresh-token rotation
-- chains, email verification, password reset, audit log, and the outbox table
-- used by the @Scheduled poller for cross-cutting events (emails, etc).

------------------------------------------------------------------------------
-- app_user
------------------------------------------------------------------------------
CREATE TABLE app_user (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email               CITEXT       NOT NULL,
    email_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
    password_hash       TEXT         NULL,            -- NULL for OAuth-only users
    name                TEXT         NULL,
    image_url           TEXT         NULL,
    locale              VARCHAR(10)  NOT NULL DEFAULT 'en',
    country_code        CHAR(2)      NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE','LOCKED','DISABLED','DELETED')),
    failed_login_count  SMALLINT     NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ  NULL,
    last_login_at       TIMESTAMPTZ  NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by          UUID         NULL,
    updated_by          UUID         NULL,
    CONSTRAINT uq_user_email UNIQUE (email)
);

CREATE INDEX ix_user_status ON app_user(status);

------------------------------------------------------------------------------
-- user_role  (multi-role ready)
------------------------------------------------------------------------------
CREATE TABLE user_role (
    user_id  UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role     VARCHAR(30)  NOT NULL CHECK (role IN ('USER','ADMIN','SUPER_ADMIN','MERCHANT')),
    PRIMARY KEY (user_id, role)
);

------------------------------------------------------------------------------
-- user_preference  (1:1 to app_user)
------------------------------------------------------------------------------
CREATE TABLE user_preference (
    user_id              UUID         PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    preferred_currency   CHAR(3)      NOT NULL DEFAULT 'INR',
    email_opt_in         BOOLEAN      NOT NULL DEFAULT TRUE,
    weekly_digest_opt_in BOOLEAN      NOT NULL DEFAULT TRUE,
    marketing_opt_in     BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

------------------------------------------------------------------------------
-- oauth_account
------------------------------------------------------------------------------
CREATE TABLE oauth_account (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    provider          VARCHAR(30)  NOT NULL,           -- 'google'
    provider_user_id  VARCHAR(200) NOT NULL,
    email_at_provider CITEXT       NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX ix_oauth_user ON oauth_account(user_id);

------------------------------------------------------------------------------
-- refresh_token (opaque, hashed, rotated, replay-detected)
------------------------------------------------------------------------------
CREATE TABLE refresh_token (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    token_hash  BYTEA        NOT NULL,                 -- SHA-256(opaque)
    parent_id   UUID         NULL REFERENCES refresh_token(id),
    used_at     TIMESTAMPTZ  NULL,
    revoked_at  TIMESTAMPTZ  NULL,
    user_agent  TEXT         NULL,
    ip_inet     VARCHAR(45)  NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash)
);

CREATE INDEX ix_refresh_user_active ON refresh_token(user_id, expires_at)
    WHERE used_at IS NULL AND revoked_at IS NULL;
CREATE INDEX ix_refresh_parent ON refresh_token(parent_id)
    WHERE parent_id IS NOT NULL;

------------------------------------------------------------------------------
-- email_verification_token (single-use, 24h TTL)
------------------------------------------------------------------------------
CREATE TABLE email_verification_token (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    token_hash  BYTEA        NOT NULL,
    used_at     TIMESTAMPTZ  NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_evt_hash UNIQUE (token_hash)
);

CREATE INDEX ix_evt_user ON email_verification_token(user_id);

------------------------------------------------------------------------------
-- password_reset_token (single-use, 1h TTL)
------------------------------------------------------------------------------
CREATE TABLE password_reset_token (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    token_hash  BYTEA        NOT NULL,
    used_at     TIMESTAMPTZ  NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_prt_hash UNIQUE (token_hash)
);

CREATE INDEX ix_prt_user ON password_reset_token(user_id);

------------------------------------------------------------------------------
-- audit_log (append-only)
------------------------------------------------------------------------------
CREATE TABLE audit_log (
    id           BIGSERIAL    PRIMARY KEY,
    actor_id     UUID         NULL REFERENCES app_user(id) ON DELETE SET NULL,
    action       VARCHAR(60)  NOT NULL,
    target_type  VARCHAR(40)  NOT NULL,
    target_id    UUID         NULL,
    ip_inet      VARCHAR(45)  NULL,
    user_agent   TEXT         NULL,
    metadata     JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_audit_actor_created ON audit_log(actor_id, created_at DESC);
CREATE INDEX ix_audit_action_created ON audit_log(action, created_at DESC);
CREATE INDEX brin_audit_created ON audit_log USING brin(created_at);

------------------------------------------------------------------------------
-- outbox (DB-backed event queue; @Scheduled poller drains every 5s)
------------------------------------------------------------------------------
CREATE TABLE outbox (
    id              BIGSERIAL    PRIMARY KEY,
    topic           VARCHAR(60)  NOT NULL,             -- email.send, sitemap.dirty, search.reindex...
    payload         JSONB        NOT NULL,
    attempts        SMALLINT     NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    processed_at    TIMESTAMPTZ  NULL,
    last_error      TEXT         NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_outbox_pending
    ON outbox(next_attempt_at)
    WHERE processed_at IS NULL;
CREATE INDEX ix_outbox_topic_created
    ON outbox(topic, created_at DESC);
