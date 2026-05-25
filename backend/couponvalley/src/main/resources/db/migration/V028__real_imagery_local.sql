-- V028: Populate real imagery using LOCAL /public assets.
--
-- V026 tried this with Clearbit + Unsplash hot-links. Many Indian-only brand
-- domains 404'd silently on Clearbit and some Unsplash photo IDs went stale,
-- so V027 reverted everything to placehold.co colour tiles.
--
-- This time the assets live in frontend/couponvalley/public/{brands,banners,
-- articles,authors}/ and are served same-origin. No CDN dependency, no
-- silent 404s, fastest possible LCP. ~3 MB total on disk.
--
-- All UPDATEs are conditional on the row still pointing at placehold.co so
-- admin-edited rows (and any later real-photo additions) are preserved.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) STORES — top 15 brands.
-- ───────────────────────────────────────────────────────────────────────────

-- 1a) The four Indian e-commerce giants are referenced by category links in
--     R__seed_dev_data.sql but never actually INSERTed. Add them now so the
--     /stores page, banner CTAs, and trusted-brands rail have real targets.
INSERT INTO store (slug, name, logo_url, description, short_description,
                   rating, review_count, primary_url, country_code, status,
                   popularity_score, brand_color, tagline, cashback_rate,
                   is_featured)
VALUES
  ('amazon-india', 'Amazon India', '/brands/amazon.png',
   'India''s largest online marketplace with millions of products across electronics, fashion, home, and groceries — plus same-day delivery via Amazon Prime.',
   'India''s largest online marketplace',
   4.5, 234000, 'https://amazon.in', 'IN', 'ACTIVE', 98,
   '#FF9900', 'Big Billion Days deals every week',
   'Save Up to 7% Extra', TRUE),

  ('flipkart', 'Flipkart', '/brands/flipkart.png',
   'India''s home-grown e-commerce leader with electronics, fashion, home, and groceries — home of the Big Billion Days sale.',
   'India''s leading e-commerce platform',
   4.4, 198000, 'https://flipkart.com', 'IN', 'ACTIVE', 97,
   '#2874F0', 'Big Billion Days deals every week',
   'Save Up to 6% Extra', TRUE),

  ('myntra', 'Myntra', '/brands/myntra.png',
   'India''s #1 fashion destination with 5,000+ international and Indian brands across clothing, footwear, accessories, and beauty.',
   'India''s #1 fashion destination',
   4.3, 156000, 'https://myntra.com', 'IN', 'ACTIVE', 95,
   '#FF3F6C', '5,000+ fashion brands',
   'Save Up to 12% Extra', TRUE),

  ('nykaa', 'Nykaa', '/brands/nykaa.png',
   'India''s leading beauty and wellness destination with 2,000+ brands of skincare, makeup, haircare, and fragrance.',
   'India''s top beauty destination',
   4.5, 142000, 'https://nykaa.com', 'IN', 'ACTIVE', 94,
   '#FC2779', 'India''s top beauty destination',
   'Save Up to 10% Extra', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 1b) Existing stores in the seed — flip the logo_url over to local files.
UPDATE store SET logo_url = '/brands/apple.png'      WHERE slug = 'apple-india'   AND logo_url LIKE '%placehold.co%';
UPDATE store SET logo_url = '/brands/samsung.png'    WHERE slug = 'samsung-india' AND logo_url LIKE '%placehold.co%';
UPDATE store SET logo_url = '/brands/nike.png'       WHERE slug = 'nike-india'    AND logo_url LIKE '%placehold.co%';
UPDATE store SET logo_url = '/brands/adidas.png'     WHERE slug = 'adidas-india'  AND logo_url LIKE '%placehold.co%';
UPDATE store SET logo_url = '/brands/uber.png'       WHERE slug = 'uber'          AND logo_url LIKE '%placehold.co%';
UPDATE store SET logo_url = '/brands/phonepe.png'    WHERE slug = 'phonepe'       AND logo_url LIKE '%placehold.co%';
UPDATE store SET logo_url = '/brands/paytm.png'      WHERE slug = 'paytm'         AND logo_url LIKE '%placehold.co%';
UPDATE store SET logo_url = '/brands/bookmyshow.png' WHERE slug = 'bookmyshow'    AND logo_url LIKE '%placehold.co%';
UPDATE store SET logo_url = '/brands/decathlon.png'  WHERE slug = 'decathlon'     AND logo_url LIKE '%placehold.co%';
UPDATE store SET logo_url = '/brands/dominos.png'    WHERE slug = 'dominos-india' AND logo_url LIKE '%placehold.co%';
UPDATE store SET logo_url = '/brands/lenskart.png'   WHERE slug = 'lenskart'      AND logo_url LIKE '%placehold.co%';

-- 1c) The four new stores also need stats / content_writer / store_top_offer
--     rows so they look complete on the store detail page. R__seed has the
--     INSERT … FROM store … patterns that produce those rows on next reload,
--     but R__seed only re-runs when its checksum changes, so do it inline.
INSERT INTO stats (store_id, total_offers, coupon_codes, in_store_coupons, free_shipping_deals)
SELECT s.id,
       (s.popularity_score / 10 + 8),
       (s.popularity_score / 20 + 3),
       (s.popularity_score / 25 + 1),
       (s.popularity_score / 30 + 2)
FROM store s
WHERE s.slug IN ('amazon-india','flipkart','myntra','nykaa')
ON CONFLICT (store_id) DO NOTHING;

INSERT INTO content_writer (store_id, name, role, bio)
SELECT s.id,
       CASE s.slug
         WHEN 'amazon-india' THEN 'Priya Sharma'
         WHEN 'flipkart'     THEN 'Rahul Mehta'
         WHEN 'myntra'       THEN 'Anjali Singh'
         ELSE                     'Neha Gupta'
       END,
       'Deals & Savings Editor',
       'Our savings expert has spent years tracking the best deals and coupon codes at ' || s.name ||
       '. Updated daily so you never miss a saving.'
FROM store s
WHERE s.slug IN ('amazon-india','flipkart','myntra','nykaa')
ON CONFLICT (store_id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 2) BANNERS — point HERO_CAROUSEL + PROMO_CARD images at /banners/*.jpg
--    We only downloaded 4 themed photos this pass; map by title.
-- ───────────────────────────────────────────────────────────────────────────

-- HERO_CAROUSEL banners (R__seed_dev_data.sql section 14)
UPDATE banner SET image_url = '/banners/flash-sale.jpg'  WHERE placement = 'HERO_CAROUSEL' AND title = 'Big Billion Days Are Back' AND image_url LIKE '%placehold.co%';
UPDATE banner SET image_url = '/banners/flash-sale.jpg'  WHERE placement = 'HERO_CAROUSEL' AND title = 'Great Indian Festival'     AND image_url LIKE '%placehold.co%';
UPDATE banner SET image_url = '/banners/fashion.jpg'     WHERE placement = 'HERO_CAROUSEL' AND title = 'Nykaa Pink Sale'            AND image_url LIKE '%placehold.co%';
UPDATE banner SET image_url = '/banners/fashion.jpg'     WHERE placement = 'HERO_CAROUSEL' AND title LIKE 'Myntra%'                 AND image_url LIKE '%placehold.co%';
UPDATE banner SET image_url = '/banners/flash-sale.jpg'  WHERE placement = 'HERO_CAROUSEL' AND title LIKE 'Decathlon%'              AND image_url LIKE '%placehold.co%';
UPDATE banner SET image_url = '/banners/travel.jpg'      WHERE placement = 'HERO_CAROUSEL' AND title LIKE 'MakeMyTrip%'             AND image_url LIKE '%placehold.co%';
UPDATE banner SET image_url = '/banners/flash-sale.jpg'  WHERE placement = 'HERO_CAROUSEL' AND title LIKE 'PhonePe%'                AND image_url LIKE '%placehold.co%';
UPDATE banner SET image_url = '/banners/electronics.jpg' WHERE placement = 'HERO_CAROUSEL' AND title LIKE 'Samsung%'                AND image_url LIKE '%placehold.co%';

-- PROMO_CARD banners (V023 / V024 set), grouped by theme
UPDATE banner SET image_url = '/banners/travel.jpg'      WHERE placement = 'PROMO_CARD' AND link_url = '/categories/travel'        AND image_url LIKE '%placehold.co%';
UPDATE banner SET image_url = '/banners/electronics.jpg' WHERE placement = 'PROMO_CARD' AND link_url = '/categories/electronics'   AND image_url LIKE '%placehold.co%';
UPDATE banner SET image_url = '/banners/fashion.jpg'     WHERE placement = 'PROMO_CARD' AND link_url = '/categories/fashion'       AND image_url LIKE '%placehold.co%';
UPDATE banner SET image_url = '/banners/fashion.jpg'     WHERE placement = 'PROMO_CARD' AND link_url = '/categories/beauty-health' AND image_url LIKE '%placehold.co%';
UPDATE banner SET image_url = '/banners/flash-sale.jpg'  WHERE placement = 'PROMO_CARD' AND image_url LIKE '%placehold.co%';

-- Catch-all for any banner still on placehold (TOP_BAR, or stragglers).
UPDATE banner SET image_url = '/banners/flash-sale.jpg' WHERE image_url LIKE '%placehold.co%';

-- ───────────────────────────────────────────────────────────────────────────
-- 3) ARTICLE HERO IMAGES — one photo per blog post.
-- ───────────────────────────────────────────────────────────────────────────
UPDATE article SET hero_image_url = '/articles/coupon-guide.jpg' WHERE slug = 'how-to-use-coupon-codes-india'    AND (hero_image_url IS NULL OR hero_image_url LIKE '%placehold.co%');
UPDATE article SET hero_image_url = '/articles/amazon-deals.jpg' WHERE slug = 'best-amazon-india-coupons-2025'   AND (hero_image_url IS NULL OR hero_image_url LIKE '%placehold.co%');
UPDATE article SET hero_image_url = '/articles/grocery.jpg'      WHERE slug = 'top-10-grocery-delivery-apps-india' AND (hero_image_url IS NULL OR hero_image_url LIKE '%placehold.co%');
UPDATE article SET hero_image_url = '/articles/flights.jpg'      WHERE slug = 'best-flight-booking-deals-india'  AND (hero_image_url IS NULL OR hero_image_url LIKE '%placehold.co%');
UPDATE article SET hero_image_url = '/articles/skincare.jpg'     WHERE slug = 'skincare-deals-india-2025'        AND (hero_image_url IS NULL OR hero_image_url LIKE '%placehold.co%');
UPDATE article SET hero_image_url = '/articles/electronics.jpg'  WHERE slug = 'electronics-buying-guide-india'   AND (hero_image_url IS NULL OR hero_image_url LIKE '%placehold.co%');

-- ───────────────────────────────────────────────────────────────────────────
-- 4) AUTHOR AVATARS — local SVG (DiceBear-generated, downloaded once).
-- ───────────────────────────────────────────────────────────────────────────
UPDATE author SET avatar_url = '/authors/priya-sharma.svg' WHERE slug = 'priya-sharma' AND avatar_url LIKE '%placehold.co%';
UPDATE author SET avatar_url = '/authors/rahul-mehta.svg'  WHERE slug = 'rahul-mehta'  AND avatar_url LIKE '%placehold.co%';
UPDATE author SET avatar_url = '/authors/anjali-singh.svg' WHERE slug = 'anjali-singh' AND avatar_url LIKE '%placehold.co%';
UPDATE author SET avatar_url = '/authors/vikram-nair.svg'  WHERE slug = 'vikram-nair'  AND avatar_url LIKE '%placehold.co%';
