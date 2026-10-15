# Homepage v3: implement the Claude Design "Clipupp" build

**Date:** 2026-10-12
**Branch:** `New-design-v1` (continues on top of the v2 work; nothing from v2 is thrown away, it is upgraded)
**Design source:** `~/Downloads/Clipupp/index.html` + `data/feed.json` + `brands/` (Claude Design export; inventory at scratchpad `design-v3/inventory.md`)
**Supersedes:** `2026-10-12-homepage-v2-design.md` for the homepage; everything v2 added to the backend stays.

## Decisions taken with Vishnu (2026-10-12)

- Deals block is **admin-managed** (`deal` entity, admin CRUD, CSV import). A partner feed adapter can be added later behind the same shape.
- **New entities** for bank offers and the sale calendar: `bank_offer`, and `campaign` extended to act as a sale event and as a hero spotlight.
- **Real feedback loop**: users vote "Worked" or "Didn't work" after reveal; success rate is computed from votes.
- **Telegram** replaces WhatsApp for deal alerts and sale reminders.
- **Dark mode**, **guest saved coupons** (local, merged on login), and the rest of the design's "advanced" behaviour are in scope.

## Decisions taken by the implementer (override if wrong)

1. Brand stays `#8529CD` (site token), not the design's `#7c2ae8`. Everything else in the design's palette maps to the existing token names; new tokens are added where the design has no equivalent (`deep`, `gold`, `ok-bg`, `bad-bg`, `warn-bg`, `skel`, footer `ft-*`).
2. Breakpoints use Tailwind `sm` (640) and `lg` (1024) instead of the design's 640 / 1000.
3. The header keeps the account control (Sign in pill, or avatar menu). The design has none; the site has accounts. Order on desktop: Categories, Stores, theme toggle, Saved (with badge), Alerts bell, account.
4. Dark mode applies to the homepage and the shared chrome (header, footer, bottom nav, dialogs, toasts). Every other route sets `data-theme="light"` on its layout wrapper until it is migrated, so no page ships half-dark.
5. Telegram alert flow uses a bot deep link (`https://t.me/<bot>?start=<nonce>`), a webhook in prod and long polling in dev. No phone numbers are collected.
6. FAQ copy and the footer "popular searches" are site settings (admin-editable JSON), with the design's text as the seeded default.
7. The "Diwali in N days" strip reads `festival.name` and `festival.date` settings; it hides itself after the date.
8. "Verified today" counts coupons with `verified_at` in the current IST day. "Worked last 7 days" is the vote-based rate across all coupons with at least 20 votes in the window; below that threshold the hero shows active coupon count instead, never a made-up percentage.
9. A coupon with 2 or more "Didn't work" votes in 24h and no "Worked" vote in that window is auto-hidden from public lists (`status = HIDDEN`, `hidden_reason = AUTO_FEEDBACK`) and appears in an admin re-check queue. Admin re-verify restores it.
10. Every outbound store or deal link goes through the existing `/r/{id}` redirect so clicks are tracked. Deals get their own `/d/{id}` redirect.
11. No polling or local feed cache in the browser. The page is server-rendered from the cached payload (ISR 60s); the "Updated N min ago" label uses the payload's `generatedAt`; the refresh button triggers `router.refresh()`.
12. Hindi stays a real locale switch (the site already has `/hi`), not the design's "coming soon" toast.
13. "Buy on {Store}" deal cards stay in copy because the deals block exists only when an admin has published deals; the coupons-only rule applies to cashback copy, not to price deals.

## Page structure (document order)

| # | Block | Section code | Data source |
|---|---|---|---|
| 0a | Announcement strip with festival countdown | `announcement` (existing bar, restyled) | settings `festival.*`, existing announcement settings |
| 0b | Header + mega menu + search + theme + saved + bell + account | n/a | categories, top stores per category (payload `nav`) |
| 0c | Category rail (12 chips, Festive hot) | n/a (always on) | categories with `icon`, `hot` |
| 1 | Hero: copy, search (lg+), trust row, popular chips, spotlight carousel | `hero_search` | stats, popular stores, spotlight campaigns |
| 2 | Live verification ticker | `ticker` (new) | last 10 verified coupons |
| 3 | Popular stores strip | `popular_stores` (new) | stores by popularity |
| 4 | Trending coupons rail + category chips | `trending_coupons` | verified coupons by popularity, with categories |
| 5 | Deals rail + source chips | `deals` (new) | `deal` entity |
| 6 | Today's top coupons: tabs with counts, sort, store filter, paging | `top_deals` | per-category coupons + counts; cursor endpoint for "Show more" |
| 7 | Bank and card offers rail + bank chips | `bank_offers` | `bank_offer` entity |
| 8 | Festive sale calendar rail + Remind me | `sale_calendar` (new) | campaigns with `kind = SALE` |
| 9 | Top stores grid (12 lg, 7 + "All stores" below) | `featured_stores` | stores with counts and deal label |
| 10 | How we verify band with 3 stats | `verify_band` | stats |
| 11 | Alerts: Telegram card + weekly email card | `alerts` (new, replaces `newsletter`) | telegram subscription, newsletter |
| 12 | FAQ accordion + FAQPage JSON-LD | `faq` (re-enabled) | settings `faq.items` |
| 13 | Footer: trust row, 5 columns, partner card, popular searches, disclosure, locale, back to top | n/a | settings, stores, categories |
| ov | Bottom nav (Home, Deals, Coupons, Stores, Saved), coupon sheet, saved sheet, categories sheet, toast | n/a | client |

Disabled rows stay disabled. `newsletter` is renamed in place to `alerts` by migration (keeps admin copy).

## Backend

### New and changed entities (one migration `V038__homepage_v3.sql`)

- `deal`: `id, slug, store_id, title, image_url, product_url, price numeric(12,2), list_price numeric(12,2), currency 'INR', rating numeric(2,1) null, review_count int null, category_id null, source enum(MANUAL, AMAZON, FLIPKART, CSV), external_id text null, lowest_30d bool, starts_at, ends_at, status enum(ACTIVE, HIDDEN, EXPIRED), position int, click_count int, created/updated/deleted_at`. Unique `(source, external_id)` when not null.
- `bank_offer`: `id, bank text, store_id, title, terms, card_types text[] (CREDIT, DEBIT, EMI), art_start text, art_end text, starts_at, ends_at, status, position, created/updated`.
- `campaign` gains: `kind enum(CAMPAIGN, SALE) default CAMPAIGN`, `store_id null`, `summary text null`, `perks text[] default '{}'`, `flag text null`, `spotlight bool default false`, `spotlight_coupon_id null`.
- `coupon_feedback`: `id, coupon_id, worked bool, user_id null, visitor_hash text (sha256 of ip+ua+day salt), created_at`. Index `(coupon_id, created_at)`. Unique `(coupon_id, visitor_hash)` so one vote per visitor per day.
- `coupon` gains `hidden_reason text null`.
- `telegram_subscriber`: `id, chat_id bigint unique, username text null, first_name text null, daily_codes bool default true, link_nonce text null, linked_at, unsubscribed_at, created_at`.
- `sale_reminder`: `id, campaign_id, subscriber_id (telegram) null, email text null, sent_at null, created_at`. Unique `(campaign_id, subscriber_id)` and `(campaign_id, email)`.
- `deal_click`: reuse `click` table with `kind = DEAL` (add column `kind` default `COUPON` and `deal_id` nullable) so `/d/{id}` tracking lands in the same analytics.
- Settings seeded (public): `festival.name = Diwali`, `festival.date = 2026-11-08`, `faq.items` (the 5 design Q/As), `footer.popular_searches` (16 design strings as `{label, href}` pairs pointing at real routes: store pages, category pages, `/offers`), `footer.partner_email = partners@clipupp.com`, `support.email = help@clipupp.com`, `telegram.bot_username`.
- Private settings: `telegram.bot_token` (env `TELEGRAM_BOT_TOKEN`, not in DB), `telegram.webhook_secret` (env).
- `homepage_section` rows: insert `ticker` (15), `popular_stores` (18), `deals` (30), `sale_calendar` (55), `faq` re-enabled (80); rename `newsletter` to `alerts` (70); re-position hero 10, trending 20, top_deals 40, bank_offers 50, featured_stores 60, verify_band 65.

### Feedback and success rate

- `POST /api/v1/coupons/{id}/feedback {worked: bool}` public, rate limited (Bucket4j, 20/min/IP). Stores a row keyed by visitor hash; returns `{successRate, votes}` for the coupon.
- `CouponFeedbackService.rateFor(couponId)`: worked / total over the last 7 days, null when total < 5.
- Site rate: worked / total over the last 7 days across coupons with 20+ total votes, null when fewer than 100 total votes.
- Auto-hide rule from decision 9 runs inside the feedback transaction. Evicts `homepage.layout`, `homepage.top`, `coupon.detail`.
- Admin: `GET /api/v1/admin/coupons/recheck-queue` lists auto-hidden coupons; existing bulk VERIFY restores and re-stamps.

### Telegram

- `TelegramClient` (RestClient to `https://api.telegram.org/bot{token}`): `sendMessage`, `setWebhook`, `getUpdates`.
- `POST /api/v1/telegram/webhook` (header `X-Telegram-Bot-Api-Secret-Token` must equal the secret) handles `/start <nonce>` (links subscriber), `/stop` (unsubscribes), `/help`.
- Dev profile: `TelegramPollingRunner` calls `getUpdates` every 3s when `telegram.polling = true`.
- `POST /api/v1/alerts/telegram/link` public: creates a nonce, returns `{url: https://t.me/<bot>?start=<nonce>, nonce}`; `GET /api/v1/alerts/telegram/status?nonce=` lets the page show "Linked as @name" once the webhook has bound the chat.
- `DailyCodesJob` at 09:00 IST: top 5 verified coupons by popularity, one message per subscriber with `daily_codes = true`, links through `/r/{id}`.
- `SaleReminderJob` at 09:00 IST: for sales starting today, message every `sale_reminder` row, mark `sent_at`.
- `POST /api/v1/alerts/sale-reminders {campaignSlug, nonce | email}` creates a reminder (Telegram via linked nonce, or email for signed-out users who prefer it).
- All Telegram sends go through the existing outbox so a provider outage never fails a request.

### Deals

- `DealService` with admin CRUD (`/api/v1/admin/deals`, Spring page), CSV import (`title, storeSlug, productUrl, imageUrl, price, listPrice, rating, reviewCount, categorySlug, endsAt, lowest30d`), bulk hide/expire, reorder.
- Public `GET /api/v1/deals?source=&limit=` cursor page; homepage payload embeds up to 12 active deals ordered by `ends_at asc nulls last, position`.
- `GET /d/{id}` redirect with click logging, like `/r/{id}`.
- `next.config.mjs` `remotePatterns` gains `m.media-amazon.com`, `images-eu.ssl-images-amazon.com`, `rukmini1.flixcart.com`, `rukminim2.flixcart.com`; admin uploads to R2 remain the default.
- Expiry sweep: hourly job sets `status = EXPIRED` when `ends_at < now`.

### Bank offers and sales

- `BankOfferService` admin CRUD + reorder; public list embedded in the payload ordered by position; filter chips from distinct banks.
- `CampaignService`: `kind = SALE` rows feed the calendar (`startsAt`, `endsAt`, `store`, `summary`); `spotlight = true` rows (max 3, newest first) feed the hero carousel with `perks`, `flag`, `spotlightCouponId`. Admin campaign form gains these fields.
- State (live / soon / ended) is computed server-side in IST and also client-side for the countdown label.

### Homepage payload (`GET /api/v1/homepage`)

Extends the v2 `HomepageLayout`:

```
stats: { verifiedToday, verifiedLast7d, activeCoupons, activeStores, successRate7d|null, generatedAt }
nav:   { categories: [{slug,title,icon,hot,couponCount,topStores:[{slug,name}]}], popularStores: [...StoreSummary] }
section payloads gain: tickerCoupons, deals, bankOffers, sales, spotlight, categoryCounts, faq
coupon summaries gain: successRate|null, feedbackVotes, badge (derived: "12%" / "₹500" / "Deal")
```

`HomepageResolver` fills each by section code as in v2; one query per block, all inside the cached layout. Cache eviction extends to deal, bank offer and feedback writes.

### Search

- `GET /api/v1/search/suggest` returns `kind` in `STORE | COUPON | CATEGORY | DEAL`; deals included (max 3).
- Bank intent (`bank|card|hdfc|sbi|icici|axis|kotak|rbl`) is a client rule that adds a "Jump to bank offers" row.

### Tests

- Unit: feedback rate math and auto-hide rule; sale state; spotlight selection; badge derivation; daily job message composition.
- Testcontainers IT: V038 on fresh DB; deal, bank offer and feedback queries.
- WebMvc slice: Telegram webhook secret check; feedback rate limit returns 429.

## Frontend

### Tokens and theming

- `globals.css` gains the design's extra tokens (light and dark): `deep`, `deep-2`, `gold`, `ok-bg`, `bad-bg`, `warn-bg`, `skel`, `skel-hi`, `ft-*`, `shadow-pop`. Dark overrides for every existing `--clipupp-*` token following the design's dark palette, under `:root[data-theme="dark"]` and the `prefers-color-scheme` fallback guarded by `:root:not([data-theme="light"])`.
- `next-themes` `ThemeProvider` with `attribute="data-theme"`, `storageKey="clipupp:theme"`, inline pre-paint script (next-themes does this) so there is no flash.
- Non-homepage route groups wrap in `<div data-theme="light">` (decision 4).
- Motion keyframes from the inventory section 1.5 ported: `pulse`, `shim`, `up`, `megaIn`, `sheetUp`, `sheen`, `peel`, `codeIn`, `stamp`, `heart`, `okpop`, `rise`, `rot`, `marq`; all under `prefers-reduced-motion: no-preference`; transform/opacity/`translate` only (hover lift lesson from v2 applies).

### Components (server unless marked client)

- `AnnouncementStrip` (restyle of AnnouncementBar): festival countdown computed server-side in IST, dismiss persisted in a cookie (existing mechanism).
- `Header`: wordmark, search (`HeaderSearch` client, upgraded: recent searches, popular stores on empty, bank-intent jump, `/` shortcut, Escape, arrow keys with `aria-activedescendant`), `CategoriesMenu` client (mega grid lg+, bottom sheet below), `ThemeToggle` client, `SavedButton` client (badge from `useSavedCoupons`), alerts bell link, account control, phone collapse-on-scroll (client, transform only).
- `CategoryRail`: 12 chips with icons from `category.icon` (lucide name mapping) and `hot`; click goes to `/categories/{slug}`; on the homepage it also switches the Today tab (client enhancement).
- `HeroSection`: copy, `HeroSearch` (lg+), trust row (`verifiedToday`, `successRate7d` or active coupons, `activeStores`), popular chips (`/stores/{slug}`), `SpotlightCarousel` client (scroll-snap, dots, arrows lg+, auto-advance rules from inventory 2.4.1, pauses on interaction and reduced motion).
- `LiveTicker`: CSS marquee of the 10 latest verified coupons, duplicated copy `aria-hidden`, pause on hover, reduced motion scroll.
- `PopularStoresStrip`: round logos, links to store pages.
- `TrendingRail`: upgraded v2 rail with filter chips (client `RailFilter`), arrows lg+, ticket-stub `CouponCard` v3.
- `CouponCard` v3 (card and row variants): logo, store + category, heart, title, terms, tags (Verified ago, Exclusive, Ends today), perforation, meta (`successRate` when present, `used` short count), `RevealButton` client: cover with last 3 chars, peel animation, opens `CouponSheet`, persists revealed ids locally; "Get deal" for codeless.
- `CouponSheet` client (`<dialog>`; bottom sheet below lg, modal lg+): header, title, terms, code box with Copy, "Copy code and open {Store}" via `/r/{id}`, how-to list, `FeedbackRow` (POST feedback, shows the returned rate), "See all {n} {Store} coupons". Focus trap and return, drag to close.
- `DealsRail`: product cards with tinted placeholder, off badge, source logo, title, rating, price/MRP, lowest-30-days, "Buy on {Store}" via `/d/{id}`; filter chips; empty state.
- `TodaysCoupons` client island with server-rendered first page: tabs with counts (roving tabindex, arrow keys, `aria-controls`), store filter chip, sort select (Most used, Recently verified, Ending soon, Best success rate when rates exist), rows, "Show more" + sentinel fetching the cursor endpoint, empty state with "Turn on alerts".
- `BankOffersRail`: card art gradient, title, terms, "On {Store}" button that filters Today's list; bank chips.
- `SaleCalendarRail`: state styling, date range, "See {Store} codes", `RemindMeButton` client (Telegram link if linked, else email prompt) backed by the reminders endpoint; "Reminder set" state.
- `TopStoresGrid` v3: 12 on lg, 7 + "All stores" expander below (client toggle), `best` label from `cashbackRate`.
- `VerifyBand` v3: lead copy, 3 stat tiles, 3-step list; copy only claims what the feedback loop delivers (decision 9 makes "hidden until it passes" true).
- `AlertsSection`: Telegram card (`TelegramLinkButton` client: calls link endpoint, opens deep link, polls status every 3s for 2 minutes, shows "Linked as @name") and the existing newsletter form.
- `FaqSection` (restored, settings-driven) with server-rendered `FAQPage` JSON-LD.
- `Footer` v3: trust row, brand column with social links from settings and "Get daily codes on Telegram", Top stores, Categories, Clipupp, Help and legal (real routes), partner card with copy-email (client), popular searches, disclosure, locale switch (English | हिन्दी real), Back to top.
- `MobileBottomNav` v3: Home, Deals, Coupons, Stores, Saved (opens `SavedSheet`); active state follows scroll on the homepage (client observer), route-based elsewhere.
- `SavedSheet` client: list of saved coupons (local + account), empty state.
- `Toast` provider (reuse `sonner` with the design's pill styling).
- Skeletons only inside client-fetched areas (Show more, search panel); server-rendered blocks never show skeletons.

### Saved coupons for guests

- `useSavedCoupons` (zustand + localStorage `clipupp:saved`): ids; on login, `POST /api/v1/account/saved-coupons/merge {ids}` adds them to the account and the local list is replaced by the server list. Hearts and badges read from the store.

### Copy and i18n

All strings in `messages/en.json` and `hi.json` (`home.*`, `header.*`, `catalog.card.*`, `sheet.*`, `alerts.*`, `faq.*`, `footer.*`). Admin copy (section title/subtitle, settings) wins over message defaults. No em dash, no "cashback", no fake numbers.

### SEO and performance

- Everything data-driven is server-rendered; client islands hydrate on top.
- `WebSite`, `Organization` (existing), `FAQPage`, and `ItemList` of trending coupons JSON-LD.
- Title "Clipupp | Verified coupon codes, deals and bank offers for Indian stores".
- Images: `next/image` with sizes; no `priority` below the fold; deal images lazy.
- Budget: mobile Lighthouse LCP under 2.5s on simulated slow 4G after Task 14-style verification; CLS under 0.1; hero H1 stays LCP; the spotlight image area is a fixed-height box.

### Admin

- Pages: `/admin/deals` (list, new, edit, import), `/admin/bank-offers`, campaign form gains kind/sale/spotlight fields, `/admin/coupons/recheck` queue, settings form gains festival, FAQ editor, popular searches, support emails, Telegram bot username.
- Homepage editor gains themes for the new section codes.

## Verification

- Backend `./gradlew test` (unit + IT), frontend typecheck, lint, Vitest for helpers (badge, state, short counts, rate thresholds).
- Playwright: 1440 and 390, light and dark, `/` and `/hi`: every block renders from real data; reveal opens the sheet and copies; feedback vote updates the rate; tabs keyboard; Show more loads; saved heart works signed out and merges on login; Telegram link button opens the deep link; mega menu and sheets trap focus; no horizontal scroll; no em dash or "cashback" in HTML.
- Lighthouse mobile as above.

## Out of scope

Partner feed adapters (Amazon PA-API, Flipkart Affiliate) and price history; WhatsApp; push notifications; other pages' dark mode; Hindi copy quality review.

## Needs from Vishnu

- Telegram bot token and username (BotFather). Put the token in `application-dev.yml` as `telegram.bot-token` for dev; prod reads `TELEGRAM_BOT_TOKEN`.
- Logos for Meesho and Apollo Pharmacy.
- Confirmation of decisions 1 to 13 above.
