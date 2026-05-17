-- V023: Seed 10 PROMO_CARD banners with photographic image URLs so the
-- homepage banner carousel ships out-of-the-box with real content. Frontend
-- has no hardcoded fallbacks anymore — everything comes from this table.
--
-- This migration ONLY inserts when there are fewer than 10 currently-live
-- PROMO_CARD banners. Admin-configured banners are never overwritten.

INSERT INTO banner (position, title, subtitle, image_url, link_url, active, country_code, placement, starts_at, ends_at)
SELECT v.position::SMALLINT, v.title, v.subtitle, v.image_url, v.link_url,
       TRUE, NULL, 'PROMO_CARD', now() - INTERVAL '1 minute', now() + INTERVAL '365 days'
FROM (VALUES
    (1,  'Cash Back is in bloom',
         'Earn up to 10% back on hand-picked brands this week.',
         'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=600&fit=crop&q=75',
         '/stores'),
    (2,  'Refer a friend, earn ₹500',
         'Share CouponValley and earn for every signup.',
         'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1600&h=600&fit=crop&q=75',
         '/account'),
    (3,  'Flat ₹100 off your first order',
         'New here? Sign up and grab your welcome bonus.',
         'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1600&h=600&fit=crop&q=75',
         '/sign-up'),
    (4,  'Travel deals are heating up',
         'Up to 12% Cash Back at MakeMyTrip, Cleartrip, and more.',
         'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&h=600&fit=crop&q=75',
         '/categories/travel'),
    (5,  'Up to 8% back on electronics',
         'Phones, laptops, audio — earn on every order.',
         'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1600&h=600&fit=crop&q=75',
         '/categories/electronics'),
    (6,  'Style your season',
         'Cash Back at Myntra, AJIO, Nykaa Fashion & more.',
         'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=600&fit=crop&q=75',
         '/categories/fashion'),
    (7,  'Eat out, earn back',
         'Up to 15% Cash Back at Zomato, Swiggy, dineout.',
         'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&h=600&fit=crop&q=75',
         '/categories/food-dining'),
    (8,  'Glow on a budget',
         'Beauty cashback at Nykaa, Tira, MyGlamm and more.',
         'https://images.unsplash.com/photo-1522335789203-aaa1bfc54e22?w=1600&h=600&fit=crop&q=75',
         '/categories/beauty-health'),
    (9,  'Refresh your space',
         'Cashback on furniture, decor and kitchen essentials.',
         'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&h=600&fit=crop&q=75',
         '/categories/home-living'),
    (10, 'Mega deals all weekend',
         'Stacked discounts plus our highest cashback rates.',
         'https://images.unsplash.com/photo-1607083206325-caf1edba7a83?w=1600&h=600&fit=crop&q=75',
         '/offers')
) AS v(position, title, subtitle, image_url, link_url)
WHERE (
    SELECT COUNT(*) FROM banner
    WHERE placement = 'PROMO_CARD'
      AND active = TRUE
      AND (starts_at IS NULL OR starts_at <= now())
      AND (ends_at IS NULL OR ends_at > now())
) < 10;
