-- V004: store catalog. Owns the merchants we list, their stats, FAQs,
-- featured articles, content writers, and per-store top-offer text bullets.

------------------------------------------------------------------------------
-- store
------------------------------------------------------------------------------
CREATE TABLE store (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug               VARCHAR(120) NOT NULL,
    name               VARCHAR(200) NOT NULL,
    logo_url           TEXT         NOT NULL,
    description        TEXT         NOT NULL,
    short_description  VARCHAR(280) NULL,
    rating             NUMERIC(3,2) NULL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    review_count       INT          NOT NULL DEFAULT 0,
    phone              VARCHAR(40)  NULL,
    address            TEXT         NULL,
    primary_url        TEXT         NOT NULL,
    country_code       CHAR(2)      NOT NULL REFERENCES region(code),
    status             VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE','HIDDEN','DELETED')),
    popularity_score   INT          NOT NULL DEFAULT 0,
    meta_title         VARCHAR(70)  NULL,
    meta_description   VARCHAR(170) NULL,
    search_tsv         TSVECTOR,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by         UUID         NULL,
    updated_by         UUID         NULL,
    deleted_at         TIMESTAMPTZ  NULL,
    CONSTRAINT uq_store_slug UNIQUE (slug)
);

CREATE INDEX ix_store_country_status
    ON store(country_code, status)
    WHERE deleted_at IS NULL;
CREATE INDEX ix_store_popularity
    ON store(popularity_score DESC)
    WHERE status = 'ACTIVE' AND deleted_at IS NULL;
CREATE INDEX ix_store_search_tsv
    ON store USING gin(search_tsv);
CREATE INDEX ix_store_name_trgm
    ON store USING gin(name gin_trgm_ops);

CREATE OR REPLACE FUNCTION store_tsv_trigger() RETURNS trigger AS $$
BEGIN
    NEW.search_tsv :=
        setweight(to_tsvector('english', coalesce(NEW.name,'')),              'A') ||
        setweight(to_tsvector('english', coalesce(NEW.short_description,'')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.description,'')),       'C');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_store_tsv
    BEFORE INSERT OR UPDATE OF name, short_description, description
    ON store
    FOR EACH ROW EXECUTE FUNCTION store_tsv_trigger();

------------------------------------------------------------------------------
-- store_top_offer  (ordered text bullets shown on the store header)
------------------------------------------------------------------------------
CREATE TABLE store_top_offer (
    store_id  UUID     NOT NULL REFERENCES store(id) ON DELETE CASCADE,
    position  SMALLINT NOT NULL,
    text      TEXT     NOT NULL,
    PRIMARY KEY (store_id, position)
);

------------------------------------------------------------------------------
-- stats  (one-to-one with store)
------------------------------------------------------------------------------
CREATE TABLE stats (
    store_id            UUID PRIMARY KEY REFERENCES store(id) ON DELETE CASCADE,
    total_offers        INT NOT NULL DEFAULT 0,
    coupon_codes        INT NOT NULL DEFAULT 0,
    in_store_coupons    INT NOT NULL DEFAULT 0,
    free_shipping_deals INT NOT NULL DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

------------------------------------------------------------------------------
-- content_writer  (one-to-one with store; the by-line on the store page)
------------------------------------------------------------------------------
CREATE TABLE content_writer (
    store_id   UUID PRIMARY KEY REFERENCES store(id) ON DELETE CASCADE,
    name       VARCHAR(200) NOT NULL,
    role       VARCHAR(120) NOT NULL,
    bio        TEXT         NOT NULL,
    image_url  TEXT         NULL,
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

------------------------------------------------------------------------------
-- faq  (per-store)
------------------------------------------------------------------------------
CREATE TABLE faq (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id   UUID         NOT NULL REFERENCES store(id) ON DELETE CASCADE,
    position   SMALLINT     NOT NULL,
    question   TEXT         NOT NULL,
    answer     TEXT         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_faq_store_position ON faq(store_id, position);

------------------------------------------------------------------------------
-- featured_article  (per-store editorial blurbs on the store page)
------------------------------------------------------------------------------
CREATE TABLE featured_article (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id    UUID         NOT NULL REFERENCES store(id) ON DELETE CASCADE,
    position    SMALLINT     NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT         NOT NULL,
    url         TEXT         NULL,
    author      VARCHAR(200) NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_featured_article_store_position ON featured_article(store_id, position);
