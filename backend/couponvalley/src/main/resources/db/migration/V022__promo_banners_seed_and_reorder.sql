-- V022: Ensure the home page has live PROMO_CARD banners and that the
-- "Promo banners" homepage section sits ABOVE "Trending stores" (which the
-- product surface labels "Best Coupons"). This way the banner row appears
-- between the categories strip and the Best Coupons rail.

-- 1) Bump promo_banners ahead of trending_stores. trending_stores defaulted
--    to position 10 (V015), promo_banners to 20. Swap so the banner row is
--    encountered first. Also force enabled=true in case it was hidden.
UPDATE homepage_section SET position = 5, enabled = TRUE WHERE code = 'promo_banners';
UPDATE homepage_section SET position = 10 WHERE code = 'trending_stores';

-- If the row was deleted at some point, re-create it.
INSERT INTO homepage_section (code, title, subtitle, enabled, position, item_limit)
SELECT 'promo_banners', 'Promo banners', NULL, TRUE, 5, NULL
WHERE NOT EXISTS (SELECT 1 FROM homepage_section WHERE code = 'promo_banners');

-- 2) Seed 4 active PROMO_CARD banners IFF there are zero live (active +
--    in-window) PROMO_CARD banners right now. We don't touch the user's
--    custom banners if any are already live — this only fills an empty slot.
INSERT INTO banner (position, title, subtitle, image_url, link_url, active, country_code, placement, starts_at, ends_at)
SELECT v.position::SMALLINT, v.title, v.subtitle, v.image_url, v.link_url,
       TRUE, NULL, 'PROMO_CARD', now() - INTERVAL '1 minute', now() + INTERVAL '365 days'
FROM (VALUES
    (1, 'Cash Back is in bloom',
        'Earn up to 10% back on hand-picked brands this season.',
        'https://placehold.co/1600x600/F2D5D5/1A1A1A/png?text=Cash+Back+is+in+bloom&font=playfair',
        '/stores'),
    (2, 'Refer a friend, earn ₹500',
        'Share ClipUpp and earn cashback on every signup.',
        'https://placehold.co/1600x600/4F46E5/FFFFFF/png?text=Refer+%26+Earn+%E2%82%B9500&font=montserrat',
        '/account'),
    (3, 'New user bonus — Flat ₹100 off',
        'Sign up today and grab a flat ₹100 off your first order.',
        'https://placehold.co/1600x600/10B981/FFFFFF/png?text=New+User+Bonus+%E2%82%B9100&font=montserrat',
        '/sign-up'),
    (4, 'Travel deals are heating up',
        'Up to 12% Cash Back at MakeMyTrip, Cleartrip, and more.',
        'https://placehold.co/1600x600/0EA5E9/FFFFFF/png?text=Travel+Deals+%E2%9C%88&font=montserrat',
        '/categories/travel')
) AS v(position, title, subtitle, image_url, link_url)
WHERE NOT EXISTS (
    SELECT 1 FROM banner
    WHERE placement = 'PROMO_CARD'
      AND active = TRUE
      AND (starts_at IS NULL OR starts_at <= now())
      AND (ends_at IS NULL OR ends_at > now())
);
