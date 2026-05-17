-- "Trusted brands" — clean carousel of brand logos under a serif headline.
-- Slots between trending_stores (pos 10) and promo_banners (pos 20).
INSERT INTO homepage_section (code, title, subtitle, enabled, position, item_limit)
VALUES (
    'trusted_brands',
    'Explore online promo codes from brands you trust',
    NULL,
    TRUE,
    15,
    12
)
ON CONFLICT (code) DO NOTHING;
