-- V010: Add brand_color to stores (used to render brand-colored cards on the homepage)
ALTER TABLE store ADD COLUMN brand_color VARCHAR(7);

-- V010: Add placement enum to banners (HERO_CAROUSEL, TOP_BAR, PROMO_CARD)
ALTER TABLE banner ADD COLUMN placement VARCHAR(20) NOT NULL DEFAULT 'HERO_CAROUSEL';
CREATE INDEX idx_banner_placement ON banner(placement);
