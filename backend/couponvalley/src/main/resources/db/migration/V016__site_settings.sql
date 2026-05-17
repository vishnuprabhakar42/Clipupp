-- Phase 4 — Site Settings + Global Config.
--
-- Generic key/value store for everything the admin needs to control on the
-- public surface that doesn't deserve a dedicated table:
--   - Footer tagline, contact info, disclosure copy
--   - Social URLs (one row per network)
--   - Newsletter headline / subheadline / CTA copy
--   - Brand color + logo
--   - Default SEO meta + OG image
--
-- Values are stored as JSONB so a single key can hold a string, a list, or
-- a small object (e.g. a structured "footer.columns" config). The PUBLIC
-- allowlist lives in code (PublicSiteSettingsController) so admins can stage
-- internal-only keys without leaking them.

create table if not exists site_setting (
    key        text primary key,
    value      jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now(),
    updated_by uuid
);

-- Seed sensible defaults that mirror the strings currently hardcoded in the
-- public components. Subsequent edits via the admin UI overwrite these.
insert into site_setting (key, value) values
    ('brand.name',                  to_jsonb('CouponValley'::text)),
    ('brand.tagline',               to_jsonb('Striving towards making the world a better place to shop with great savings!'::text)),
    ('brand.primary_color',         to_jsonb('#7c3aed'::text)),
    ('brand.accent_color',          to_jsonb('#ffe05b'::text)),
    ('brand.logo_url',              to_jsonb(''::text)),

    ('footer.disclosure',           to_jsonb('CouponValley earns a commission when you click out to a merchant and complete a purchase. This costs you nothing extra and never affects which deals we surface — verified savings come first.'::text)),
    ('footer.commission_note',      to_jsonb('We may earn a commission if you buy through links on CouponValley.'::text)),
    ('footer.hashtag',              to_jsonb('#SaveWithCouponValley'::text)),

    ('social.whatsapp',             to_jsonb('https://wa.me/9173xxxxxx'::text)),
    ('social.facebook',             to_jsonb('https://facebook.com/couponvalley'::text)),
    ('social.x',                    to_jsonb('https://twitter.com/couponvalley'::text)),
    ('social.linkedin',             to_jsonb('https://linkedin.com/company/couponvalley'::text)),
    ('social.instagram',            to_jsonb('https://instagram.com/couponvalley'::text)),
    ('social.youtube',              to_jsonb('https://youtube.com/@couponvalley'::text)),

    ('contact.email',               to_jsonb('hello@couponvalley.in'::text)),
    ('contact.phone',               to_jsonb('+91 91734 56789'::text)),
    ('contact.address_line1',       to_jsonb('CouponValley HQ,'::text)),
    ('contact.address_line2',       to_jsonb('Bandra Kurla Complex,'::text)),
    ('contact.address_line3',       to_jsonb('Mumbai, MH 400051'::text)),

    ('newsletter.headline',         to_jsonb('Get the best deals weekly'::text)),
    ('newsletter.subheadline',      to_jsonb('One email. No spam. Unsubscribe anytime.'::text)),
    ('newsletter.cta',              to_jsonb('Subscribe'::text)),

    ('seo.default_title_template',  to_jsonb('%s · CouponValley'::text)),
    ('seo.default_description',     to_jsonb('Verified coupons, cashback, and deals from the stores you actually shop at.'::text)),
    ('seo.og_image',                to_jsonb(''::text))
on conflict (key) do nothing;
