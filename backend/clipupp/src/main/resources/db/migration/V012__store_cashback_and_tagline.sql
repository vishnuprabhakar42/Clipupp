-- V012: Per-store display fields used on the homepage card surfaces.
--
--   cashback_rate — short marketing label rendered under the brand tile,
--                   e.g. "Up to 25% Cash Back", "+₹500 Back", "5% Cash Back".
--   tagline       — short pitch shown on cards / hover, max ~80 chars.
--   is_featured   — flag to control whether the store appears in the
--                   "Featured Stores" homepage grid.
ALTER TABLE store ADD COLUMN cashback_rate VARCHAR(40);
ALTER TABLE store ADD COLUMN tagline VARCHAR(120);
ALTER TABLE store ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_store_featured ON store(is_featured) WHERE deleted_at IS NULL;

-- V012: Backfill cashback rates + taglines for the seeded Indian retailers.
--       Idempotent — only updates rows where the value is still NULL.
UPDATE store SET cashback_rate = 'Up to 7% Cash Back', tagline = 'India''s largest online marketplace', is_featured = TRUE WHERE slug = 'amazon-india' AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to 6% Cash Back', tagline = 'Big Billion Days deals every week',  is_featured = TRUE WHERE slug = 'flipkart'     AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to 12% Cash Back', tagline = '5,000+ fashion brands',             is_featured = TRUE WHERE slug = 'myntra'       AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to 10% Cash Back', tagline = 'India''s top beauty destination',   is_featured = TRUE WHERE slug = 'nykaa'        AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to ₹200 Back',     tagline = 'Order food in 30 minutes',          is_featured = TRUE WHERE slug = 'zomato'       AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to ₹150 Back',     tagline = 'Food + Instamart in 10 min',        is_featured = TRUE WHERE slug = 'swiggy'       AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to 8% Cash Back',  tagline = 'Flights, hotels, holidays',         is_featured = TRUE WHERE slug = 'makemytrip'   AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to 5% Cash Back',  tagline = 'Fresh groceries, daily',            is_featured = TRUE WHERE slug = 'bigbasket'    AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to 9% Cash Back',  tagline = 'Reliance''s premium fashion',       is_featured = TRUE WHERE slug = 'ajio'         AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to 4% Cash Back',  tagline = 'Tata electronics — 600+ stores',    is_featured = TRUE WHERE slug = 'croma'        AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to 15% Cash Back', tagline = 'Medicines, labs & wellness',        is_featured = TRUE WHERE slug = 'tata-1mg'     AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to 8% Cash Back',  tagline = '#1 audio brand in India',           is_featured = TRUE WHERE slug = 'boat'         AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to 10% Cash Back', tagline = 'Premium sportswear & footwear',     is_featured = TRUE WHERE slug = 'puma-india'   AND cashback_rate IS NULL;
UPDATE store SET cashback_rate = 'Up to 6% Cash Back',  tagline = 'Travel made simple',                is_featured = TRUE WHERE slug = 'cleartrip'    AND cashback_rate IS NULL;
