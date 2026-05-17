-- V005: category taxonomy + coupons. Both carry tsvector + pg_trgm indexes
-- so /search and /search/suggest hit a single Postgres without ES until the
-- volume warrants it (>200k coupons; documented in §9.4).

------------------------------------------------------------------------------
-- category  (hierarchical; parent_id self-FK)
------------------------------------------------------------------------------
CREATE TABLE category (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(120) NOT NULL,
    title       VARCHAR(200) NOT NULL,
    parent_id   UUID         NULL REFERENCES category(id) ON DELETE RESTRICT,
    icon        VARCHAR(60)  NULL,
    description TEXT         NULL,
    position    SMALLINT     NOT NULL DEFAULT 0,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    meta_title       VARCHAR(70)  NULL,
    meta_description VARCHAR(170) NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by  UUID         NULL,
    updated_by  UUID         NULL,
    CONSTRAINT uq_category_slug UNIQUE (slug)
);
CREATE INDEX ix_category_parent ON category(parent_id);
CREATE INDEX ix_category_active_position ON category(active, position) WHERE active;

------------------------------------------------------------------------------
-- coupon
------------------------------------------------------------------------------
CREATE TABLE coupon (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(180) NOT NULL,
    store_id        UUID         NOT NULL REFERENCES store(id) ON DELETE RESTRICT,
    type            VARCHAR(20)  NOT NULL
        CHECK (type IN ('CODE','DEAL','FREE_SHIPPING','IN_STORE')),
    code            VARCHAR(60)  NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT         NOT NULL,
    terms           TEXT         NULL,
    savings_label   VARCHAR(60)  NULL,
    min_purchase           NUMERIC(19,4) NULL,
    min_purchase_currency  CHAR(3)       NULL REFERENCES currency(code),
    starts_at       TIMESTAMPTZ  NULL,
    expires_at      TIMESTAMPTZ  NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE','EXPIRED','HIDDEN','DELETED')),
    verified        BOOLEAN      NOT NULL DEFAULT FALSE,
    exclusive       BOOLEAN      NOT NULL DEFAULT FALSE,
    used_count      INT          NOT NULL DEFAULT 0,
    click_count     INT          NOT NULL DEFAULT 0,
    popularity_score INT         NOT NULL DEFAULT 0,
    affiliate_url_override TEXT  NULL,
    meta_title       VARCHAR(70)  NULL,
    meta_description VARCHAR(170) NULL,
    search_tsv       TSVECTOR,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by      UUID         NULL,
    updated_by      UUID         NULL,
    deleted_at      TIMESTAMPTZ  NULL,
    CONSTRAINT uq_coupon_slug UNIQUE (slug)
);

CREATE INDEX ix_coupon_store_status
    ON coupon(store_id, status, expires_at)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_coupon_active_pop
    ON coupon(popularity_score DESC)
    WHERE status = 'ACTIVE' AND deleted_at IS NULL;
CREATE INDEX ix_coupon_expires
    ON coupon(expires_at)
    WHERE status = 'ACTIVE';
CREATE INDEX ix_coupon_search_tsv
    ON coupon USING gin(search_tsv);
CREATE INDEX ix_coupon_title_trgm
    ON coupon USING gin(title gin_trgm_ops);

CREATE OR REPLACE FUNCTION coupon_tsv_trigger() RETURNS trigger AS $$
BEGIN
    NEW.search_tsv :=
        setweight(to_tsvector('english', coalesce(NEW.title,'')),         'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description,'')),   'B') ||
        setweight(to_tsvector('english', coalesce(NEW.savings_label,'')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.code,'')),          'D');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coupon_tsv
    BEFORE INSERT OR UPDATE OF title, description, savings_label, code
    ON coupon
    FOR EACH ROW EXECUTE FUNCTION coupon_tsv_trigger();

------------------------------------------------------------------------------
-- coupon_category  (m2m: coupon ↔ category)
------------------------------------------------------------------------------
CREATE TABLE coupon_category (
    coupon_id   UUID NOT NULL REFERENCES coupon(id)   ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
    PRIMARY KEY (coupon_id, category_id)
);
CREATE INDEX ix_coupon_category_cat ON coupon_category(category_id);

------------------------------------------------------------------------------
-- store_category  (m2m: store ↔ category, for "stores in this category" pages)
------------------------------------------------------------------------------
CREATE TABLE store_category (
    store_id    UUID NOT NULL REFERENCES store(id)    ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
    PRIMARY KEY (store_id, category_id)
);
CREATE INDEX ix_store_category_cat ON store_category(category_id);
