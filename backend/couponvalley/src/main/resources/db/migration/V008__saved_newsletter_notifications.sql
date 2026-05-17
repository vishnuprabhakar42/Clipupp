-- V008: engagement tables — saved coupons, newsletter (double opt-in),
-- per-channel notification preferences, in-app notification inbox.

------------------------------------------------------------------------------
-- saved_coupon  (user ↔ coupon m2m)
------------------------------------------------------------------------------
CREATE TABLE saved_coupon (
    user_id   UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    coupon_id UUID         NOT NULL REFERENCES coupon(id)   ON DELETE CASCADE,
    saved_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, coupon_id)
);
CREATE INDEX ix_saved_user_saved ON saved_coupon(user_id, saved_at DESC);
CREATE INDEX ix_saved_coupon_id  ON saved_coupon(coupon_id);

------------------------------------------------------------------------------
-- newsletter_subscription  (email is the natural key; user_id optional)
------------------------------------------------------------------------------
CREATE TABLE newsletter_subscription (
    id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email                    CITEXT       NOT NULL,
    user_id                  UUID         NULL REFERENCES app_user(id) ON DELETE SET NULL,
    locale                   VARCHAR(10)  NOT NULL DEFAULT 'en',
    status                   VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','CONFIRMED','UNSUBSCRIBED')),
    confirm_token_hash       BYTEA        NULL,
    unsubscribe_token_hash   BYTEA        NOT NULL,
    confirmed_at             TIMESTAMPTZ  NULL,
    unsubscribed_at          TIMESTAMPTZ  NULL,
    source                   VARCHAR(40)  NOT NULL DEFAULT 'WEB'
        CHECK (source IN ('WEB','API','EXTENSION','IMPORT','UNKNOWN')),
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_newsletter_email UNIQUE (email)
);
CREATE INDEX ix_newsletter_status ON newsletter_subscription(status);
CREATE UNIQUE INDEX uq_newsletter_unsubscribe_hash
    ON newsletter_subscription(unsubscribe_token_hash);
CREATE UNIQUE INDEX uq_newsletter_confirm_hash
    ON newsletter_subscription(confirm_token_hash)
    WHERE confirm_token_hash IS NOT NULL;

------------------------------------------------------------------------------
-- notification_preference  (Sprint 5 channel toggles, distinct from
-- user_preference's coarse email_opt_in flag from V002)
------------------------------------------------------------------------------
CREATE TABLE notification_preference (
    user_id          UUID         PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    product_email    BOOLEAN      NOT NULL DEFAULT TRUE,
    expiring_email   BOOLEAN      NOT NULL DEFAULT TRUE,
    digest_email     BOOLEAN      NOT NULL DEFAULT TRUE,
    marketing_email  BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

------------------------------------------------------------------------------
-- notification  (in-app inbox; renderable via notifications/{id})
------------------------------------------------------------------------------
CREATE TABLE notification (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    type        VARCHAR(40)  NOT NULL,
    payload     JSONB        NOT NULL,
    read_at     TIMESTAMPTZ  NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_notification_user_unread
    ON notification(user_id, created_at DESC)
    WHERE read_at IS NULL;
CREATE INDEX ix_notification_user_created
    ON notification(user_id, created_at DESC);
