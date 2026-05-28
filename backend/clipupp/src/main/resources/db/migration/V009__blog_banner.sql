-- V009: editorial content (blog) + homepage CMS (banner).
-- Article body is stored as Markdown so a future editor can produce HTML at
-- render time (sanitized) without locking us into a particular WYSIWYG.

CREATE TABLE author (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(120) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    bio         TEXT         NULL,
    avatar_url  TEXT         NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_author_slug UNIQUE (slug)
);

CREATE TABLE article (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug             VARCHAR(180) NOT NULL,
    title            VARCHAR(200) NOT NULL,
    excerpt          VARCHAR(500) NOT NULL,
    body_md          TEXT         NOT NULL,
    hero_image_url   TEXT         NULL,
    author_id        UUID         NOT NULL REFERENCES author(id) ON DELETE RESTRICT,
    status           VARCHAR(20)  NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT','SCHEDULED','PUBLISHED','HIDDEN')),
    published_at     TIMESTAMPTZ  NULL,
    scheduled_for    TIMESTAMPTZ  NULL,
    meta_title       VARCHAR(70)  NULL,
    meta_description VARCHAR(170) NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by       UUID         NULL,
    updated_by       UUID         NULL,
    deleted_at       TIMESTAMPTZ  NULL,
    CONSTRAINT uq_article_slug UNIQUE (slug)
);

CREATE INDEX ix_article_pub
    ON article(published_at DESC)
    WHERE status = 'PUBLISHED' AND deleted_at IS NULL;

CREATE INDEX ix_article_status_scheduled
    ON article(status, scheduled_for)
    WHERE status = 'SCHEDULED';

CREATE INDEX ix_article_author
    ON article(author_id);

------------------------------------------------------------------------------
-- banner  (homepage carousel CMS — country-targeted, time-windowed)
------------------------------------------------------------------------------
CREATE TABLE banner (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    position      SMALLINT     NOT NULL DEFAULT 0,
    title         VARCHAR(200) NOT NULL,
    subtitle      VARCHAR(280) NULL,
    image_url     TEXT         NOT NULL,
    link_url      TEXT         NOT NULL,
    starts_at     TIMESTAMPTZ  NULL,
    ends_at       TIMESTAMPTZ  NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    country_code  CHAR(2)      NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by    UUID         NULL,
    updated_by    UUID         NULL
);

CREATE INDEX ix_banner_active_position
    ON banner(active, position)
    WHERE active = TRUE;
