-- Legal / info pages CMS. Slugs are fixed (admins edit body + meta only —
-- they cannot create or delete pages because the routes are hardcoded in the
-- frontend). Body is markdown; the public renderer converts to HTML.
create table if not exists legal_page (
    slug             text primary key,
    title            text not null,
    body_md          text not null,
    meta_title       text,
    meta_description text,
    updated_at       timestamptz not null default now(),
    updated_by       uuid
);

-- Seed each fixed slug with placeholder copy so the API has something to
-- return on day one. Admin can edit each via /admin/legal-pages/{slug}.
insert into legal_page (slug, title, body_md, meta_title, meta_description) values
('privacy',
 'Privacy policy',
 E'## What we collect\n\nAccount email, password (BCrypt-hashed), preferences, saved coupons, and outbound-click history for cashback attribution. Server logs include IP and user-agent for fraud detection — purged after 90 days.\n\n## How we use it\n\nTo operate the site, send transactional emails, attribute clicks to cashback when networks confirm them, and (with your consent) send weekly digest emails. We never sell your email address.\n\n## Cookies\n\nNecessary cookies (session, CSRF) are always on. Analytics and marketing cookies are off by default and only enabled if you explicitly opt in via the cookie banner. See our [Cookie policy](/cookie-policy).\n\n## Your rights\n\nYou can export your data, correct it, or delete it permanently from the [/account](/account) page. EU/UK residents have GDPR rights; California residents have CCPA rights. Email [privacy@clipupp.com](mailto:privacy@clipupp.com) with any request.\n\n## Affiliate tracking\n\nWhen you click out via `/r/{couponId}` we record the click and the merchant network records the visit. The two are joined later via the affiliate network''s postback to credit you cashback. See [affiliate disclosure](/affiliate-disclosure).',
 'Privacy policy',
 'How ClipUpp collects, uses, and protects your personal data. GDPR + CCPA compliant.'),
('terms',
 'Terms of service',
 E'## Eligibility\n\nYou must be 18 or older to create an account. By using ClipUpp you agree to these terms and our [Privacy policy](/privacy).\n\n## Acceptable use\n\nDon''t scrape, reverse-engineer, or abuse the API. Don''t game cashback by reversing transactions in bad faith.\n\n## Content\n\nCoupons and merchant information are sourced from affiliate networks and merchants directly. We strive for accuracy but cannot guarantee every offer is currently valid.\n\n## Termination\n\nWe may suspend accounts that violate these terms. You can delete your account at any time from [/account](/account).',
 'Terms of service',
 'ClipUpp terms of service.'),
('cookie-policy',
 'Cookie policy',
 E'## What cookies we set\n\n- **Necessary**: session id (clipupp_rt), CSRF token. Always on.\n- **Functional**: locale preference (clipupp_locale), theme. Only set when you change them.\n- **Analytics**: optional, opt-in via the cookie banner.\n- **Marketing**: optional, opt-in via the cookie banner.\n\n## Managing cookies\n\nUse the cookie banner at the bottom of any page to change your preferences, or your browser settings to clear cookies entirely.',
 'Cookie policy',
 'Which cookies ClipUpp sets and how to manage them.'),
('affiliate-disclosure',
 'Affiliate disclosure',
 E'ClipUpp earns a commission when you complete a qualifying purchase after clicking out from our site to a merchant. This commission does not change the price you pay.\n\n## How it works\n\n1. You click a coupon on our site.\n2. We redirect through an affiliate-network tracking link.\n3. If you complete a purchase, the network reports the conversion to us via a server-to-server postback.\n4. A portion of that commission funds the site; if cashback is enabled for that store, your share is credited to your account.\n\n## Editorial independence\n\nWe rank stores and coupons by popularity and verification, not by commission rate. Featured placements are clearly labelled.',
 'Affiliate disclosure',
 'How ClipUpp earns and the editorial standards we follow.');
