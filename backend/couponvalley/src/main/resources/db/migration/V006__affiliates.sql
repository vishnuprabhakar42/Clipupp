-- V006: affiliate networks and per-store deeplink templates.
-- Postback secrets are pgcrypto-encrypted at rest; the plaintext only ever
-- lives in the application's verification path, never in DB queries.

CREATE TABLE affiliate_network (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code                 VARCHAR(40)  NOT NULL,
    name                 VARCHAR(120) NOT NULL,
    postback_secret_enc  BYTEA        NULL,
    active               BOOLEAN      NOT NULL DEFAULT TRUE,
    config_json          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_aff_network_code UNIQUE (code)
);

CREATE TABLE merchant_network_link (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id          UUID         NOT NULL REFERENCES store(id) ON DELETE CASCADE,
    network_id        UUID         NOT NULL REFERENCES affiliate_network(id) ON DELETE RESTRICT,
    advertiser_id     VARCHAR(120) NOT NULL,
    deeplink_template TEXT         NOT NULL,
    priority          SMALLINT     NOT NULL DEFAULT 0,
    active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_mnl_store_network UNIQUE (store_id, network_id)
);

-- Active link lookup is the hot path of /r/{id}; partial index keeps it tight.
CREATE INDEX ix_mnl_store_priority
    ON merchant_network_link(store_id, priority DESC)
    WHERE active = TRUE;
