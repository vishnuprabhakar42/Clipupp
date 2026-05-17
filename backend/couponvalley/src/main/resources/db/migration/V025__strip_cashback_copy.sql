-- V025: Phase-1 messaging cleanup. Cashback functionality ships in Phase 2;
-- until then every user-facing string should talk about coupons / discounts
-- only. This migration scrubs the "cashback" wording out of seeded content
-- so the front-end never has a chance to show it.
--
-- Idempotent: every UPDATE is conditional on the old text still being present
-- so re-runs are a no-op, and admin edits made after V025 are preserved.

-- 1) PROMO_CARD banner titles + subtitles from V022/V023/V024 -----------------

UPDATE banner SET title = 'Coupons in bloom'
WHERE placement = 'PROMO_CARD' AND title = 'Cash Back is in bloom';

UPDATE banner SET subtitle = 'Use up to 10% off coupons on hand-picked brands this week.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Earn up to 10% back on hand-picked brands this week.';

UPDATE banner SET title = 'Travel coupons are heating up'
WHERE placement = 'PROMO_CARD' AND title = 'Travel deals are heating up';

UPDATE banner SET subtitle = 'Up to 12% off at MakeMyTrip, Cleartrip, and more.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Up to 12% Cash Back at MakeMyTrip, Cleartrip, and more.';

UPDATE banner SET title = 'Up to 8% off on electronics'
WHERE placement = 'PROMO_CARD' AND title = 'Up to 8% back on electronics';

UPDATE banner SET subtitle = 'Cash Back at Myntra, AJIO, Nykaa Fashion & more.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Cash Back at Myntra, AJIO, Nykaa Fashion & more.'; -- sanity placeholder, replaced below

UPDATE banner SET subtitle = 'Latest coupons at Myntra, AJIO, Nykaa Fashion & more.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Cash Back at Myntra, AJIO, Nykaa Fashion & more.';

UPDATE banner SET subtitle = 'Up to 15% off at Zomato, Swiggy, dineout.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Up to 15% Cash Back at Zomato, Swiggy, dineout.';

UPDATE banner SET subtitle = 'Coupon codes at Nykaa, Tira, MyGlamm and more.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Beauty cashback at Nykaa, Tira, MyGlamm and more.';

UPDATE banner SET subtitle = 'Coupons on furniture, decor and kitchen essentials.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Cashback on furniture, decor and kitchen essentials.';

UPDATE banner SET subtitle = 'Stacked discounts on our biggest deals of the week.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Stacked discounts plus our highest cashback rates.';

-- 2) "Refer & earn" + "Welcome bonus" banners — keep copy promotional but
--    drop cashback framing.

UPDATE banner SET title = 'Refer a friend, get ₹500 in coupons'
WHERE placement = 'PROMO_CARD' AND title = 'Refer a friend, earn ₹500';

UPDATE banner SET subtitle = 'Share CouponValley with friends and get bonus coupons.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Share CouponValley and earn for every signup.';

UPDATE banner SET subtitle = 'Share CouponValley with friends — both of you get bonus coupons.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Share CouponValley with friends and earn cashback for every signup.';

UPDATE banner SET subtitle = 'Sign up today to unlock a flat ₹100 off coupon on your first order.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Sign up today and grab a flat ₹100 off your first order.';

UPDATE banner SET subtitle = 'Sign up today and unlock a flat ₹100 off coupon on your first order.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Sign up today and grab a flat ₹100 off coupon on your first order.';

UPDATE banner SET title = 'How CouponValley works'
WHERE placement = 'PROMO_CARD' AND title = 'Gettin'' Cashback — Learn how to use CouponValley';

UPDATE banner SET subtitle = 'Save with verified coupon codes on every checkout. Here''s how it works.'
WHERE placement = 'PROMO_CARD'
  AND subtitle = 'Earn cashback on every purchase. Here''s how it works.';

-- 3) Public site_setting strings — newsletter copy, footer disclosure, hero ----

UPDATE site_setting
SET value = to_jsonb('Get the best coupon codes weekly'::text)
WHERE key = 'newsletter.headline'
  AND (value->>'')::text LIKE '%cashback%' OR value::text ILIKE '%cashback%';

UPDATE site_setting
SET value = to_jsonb('One email a week with our highest-value coupons. No spam.'::text)
WHERE key = 'newsletter.subheadline'
  AND value::text ILIKE '%cashback%';

UPDATE site_setting
SET value = to_jsonb(
  'CouponValley is a verified coupon aggregator. We may earn an affiliate commission when you click a deal; you never pay more.'::text
)
WHERE key = 'footer.disclosure'
  AND value::text ILIKE '%cashback%';

-- 4) Top bar referral banner subtitle ----------------------------------------

UPDATE banner SET title = 'Share CouponValley & get ₹500 in bonus coupons'
WHERE placement = 'TOP_BAR'
  AND title = 'Share CouponValley & earn ₹500 referral bonus';
