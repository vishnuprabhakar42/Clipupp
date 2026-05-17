-- V007: clicks (every outbound) and conversions (postback ingestion).
-- Phase 1 stops at PENDING — the wallet credit path lights up in Phase 2.

CREATE TABLE click (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    click_id      UUID         NOT NULL,                                -- public sub_id
    user_id       UUID         NULL REFERENCES app_user(id) ON DELETE SET NULL,
    coupon_id     UUID         NOT NULL REFERENCES coupon(id) ON DELETE RESTRICT,
    store_id      UUID         NOT NULL REFERENCES store(id) ON DELETE RESTRICT,
    network_id    UUID         NULL REFERENCES affiliate_network(id),
    source        VARCHAR(40)  NOT NULL DEFAULT 'WEB'
        CHECK (source IN ('WEB','EXTENSION','EMAIL','API','UNKNOWN')),
    ip_inet       VARCHAR(45)  NULL,
    user_agent    TEXT         NULL,
    referer       TEXT         NULL,
    country_code  CHAR(2)      NULL,
    outbound_url  TEXT         NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_click_id UNIQUE (click_id)
);

-- User history page (account/click-history) — descending by time.
CREATE INDEX ix_click_user_created
    ON click(user_id, created_at DESC)
    WHERE user_id IS NOT NULL;

-- Per-coupon "trending" / popularity feed.
CREATE INDEX ix_click_coupon_created
    ON click(coupon_id, created_at DESC);

-- Cheap historical scans for admin reports without bloating the index.
CREATE INDEX brin_click_created
    ON click USING brin(created_at);

CREATE TABLE conversion (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    click_id            UUID          NULL REFERENCES click(click_id) ON DELETE SET NULL,
    network_id          UUID          NOT NULL REFERENCES affiliate_network(id) ON DELETE RESTRICT,
    network_txn_id      VARCHAR(200)  NOT NULL,
    state               VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
        CHECK (state IN ('PENDING','APPROVED','REJECTED','REVERSED')),
    order_amount        NUMERIC(19,4) NULL,
    order_currency      CHAR(3)       NULL REFERENCES currency(code),
    commission_amount   NUMERIC(19,4) NULL,
    commission_currency CHAR(3)       NULL REFERENCES currency(code),
    raw_payload         JSONB         NOT NULL,
    reported_at         TIMESTAMPTZ   NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_conv_network_txn UNIQUE (network_id, network_txn_id)
);

CREATE INDEX ix_conv_click ON conversion(click_id) WHERE click_id IS NOT NULL;
CREATE INDEX ix_conv_state_created ON conversion(state, created_at DESC);
CREATE INDEX brin_conv_created ON conversion USING brin(created_at);
