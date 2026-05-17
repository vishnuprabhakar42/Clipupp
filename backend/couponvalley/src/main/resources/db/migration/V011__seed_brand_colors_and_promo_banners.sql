-- V011: Backfill brand colors on already-seeded stores so the homepage cards
--       render with the correct brand background. Idempotent: only updates
--       rows where brand_color is still NULL.
UPDATE store SET brand_color = '#FF9900' WHERE slug = 'amazon-india' AND brand_color IS NULL;
UPDATE store SET brand_color = '#2874F0' WHERE slug = 'flipkart'     AND brand_color IS NULL;
UPDATE store SET brand_color = '#FF3F6C' WHERE slug = 'myntra'       AND brand_color IS NULL;
UPDATE store SET brand_color = '#FC2779' WHERE slug = 'nykaa'        AND brand_color IS NULL;
UPDATE store SET brand_color = '#E23744' WHERE slug = 'zomato'       AND brand_color IS NULL;
UPDATE store SET brand_color = '#FC8019' WHERE slug = 'swiggy'       AND brand_color IS NULL;
UPDATE store SET brand_color = '#E8092A' WHERE slug = 'makemytrip'   AND brand_color IS NULL;
UPDATE store SET brand_color = '#84C341' WHERE slug = 'bigbasket'    AND brand_color IS NULL;
UPDATE store SET brand_color = '#1A1A1A' WHERE slug = 'ajio'         AND brand_color IS NULL;
UPDATE store SET brand_color = '#0A8D3A' WHERE slug = 'croma'        AND brand_color IS NULL;
UPDATE store SET brand_color = '#E40046' WHERE slug = 'tata-1mg'     AND brand_color IS NULL;
UPDATE store SET brand_color = '#1A1A1A' WHERE slug = 'boat'         AND brand_color IS NULL;
UPDATE store SET brand_color = '#0D0D0D' WHERE slug = 'puma-india'   AND brand_color IS NULL;
UPDATE store SET brand_color = '#0E6EFF' WHERE slug = 'cleartrip'    AND brand_color IS NULL;

-- V011: Backfill TOP_BAR banner. Only inserted if no TOP_BAR banner exists yet.
INSERT INTO banner (position, title, subtitle, image_url, link_url, active, country_code, placement, starts_at, ends_at)
SELECT 0,
       'Share CouponValley & earn ₹500 referral bonus',
       'Refer Now',
       'https://placehold.co/1x1/000000/000000?text=+',
       '/account',
       TRUE,
       'IN',
       'TOP_BAR',
       now(),
       now() + INTERVAL '60 days'
WHERE NOT EXISTS (SELECT 1 FROM banner WHERE placement = 'TOP_BAR');

-- V011: Backfill PROMO_CARD banners. Only inserted if no PROMO_CARD banner exists yet.
INSERT INTO banner (position, title, subtitle, image_url, link_url, active, country_code, placement, starts_at, ends_at)
SELECT v.position::SMALLINT, v.title, v.subtitle, v.image_url, v.link_url,
       TRUE, 'IN', 'PROMO_CARD', now(), now() + INTERVAL '90 days'
FROM (VALUES
    (1, 'Gettin'' Cashback — Learn how to use CouponValley',
        'Earn cashback on every purchase. Here''s how it works.',
        'https://placehold.co/1200x500/4F46E5/FFFFFF?text=How+Cashback+Works',
        '/how-it-works'),
    (2, 'Refer a Friend & Earn ₹500',
        'Share CouponValley with friends and earn cashback for every signup.',
        'https://placehold.co/1200x500/F59E0B/1A1A1A?text=Refer+%26+Earn+%E2%82%B9500',
        '/account'),
    (3, 'New User Bonus — Flat ₹100 Off',
        'Sign up today and grab a flat ₹100 off coupon on your first order.',
        'https://placehold.co/1200x500/10B981/FFFFFF?text=New+User+Bonus',
        '/sign-up'),
    (4, 'Download the CouponValley App',
        'Get exclusive app-only deals, instant notifications, and faster cashback.',
        'https://placehold.co/1200x500/2563EB/FFFFFF?text=Download+the+App',
        '/about')
) AS v(position, title, subtitle, image_url, link_url)
WHERE NOT EXISTS (SELECT 1 FROM banner WHERE placement = 'PROMO_CARD');
