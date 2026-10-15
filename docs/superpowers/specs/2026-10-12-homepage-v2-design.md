# Homepage v2: implement the "Clipupp Homepage v2" mockup

**Date:** 2026-10-12
**Branch:** `New-design-v1`
**Mockup:** https://claude.ai/artifact/4Le1r6ohy7XAd2RYorjSqh (Stage 1, desktop 1440).
**Brief and research:** `docs/superpowers/specs/2026-09-29-homepage-redesign-claude-design-brief.md`, `reports/Coupon homepage design benchmarks.md`.
**Scope:** Homepage, site header, footer, mobile bottom nav.
Other pages come later, one at a time.

## Decisions already taken (with Vishnu, 2026-10-12)

- Trust line per coupon is admin-set only: show "Verified Xh ago" from a new `verified_at` timestamp.
  No success rate, no user vote loop in this phase.
- Header is rebuilt to the mockup: wordmark, centre search field, Stores, Categories, Saved, Sign in.
  Locale switcher leaves the top bar and stays in the mobile drawer only.
- "Bank offers and festive sales" tiles come from the existing campaigns module.
  Bank chips come from a site setting.
- "Today's top coupons" tabs use admin-pinned categories, falling back to the first seven root categories.
- Hero H1 is "Working coupon codes for every Indian store." The footer shows "English" only.
  Hindi routes keep working, the switcher is just hidden from header and footer.

## Page structure (7 blocks)

| # | Block | Section code | Data |
|---|---|---|---|
| 0 | Sticky header | n/a | top categories for the dropdown |
| 1 | Hero: eyebrow, H1, subline, search with autosuggest, 8 category chips, proof line, 3 fanned coupon cards | `hero_search` | chips = pinned categories or first 8 roots; proof line = live stats; fan = first 3 trending coupons |
| 2 | Trending verified coupons rail (7 cards) | `trending_coupons` (new) | verified coupons by popularity |
| 3 | Top stores grid, 6 x 2 desktop, 2 x 4 mobile | `featured_stores` | pinned stores or top by popularity, each with active coupon count |
| 4 | Today's top coupons, tabbed by category, 4 rows per tab | `top_deals` | pinned categories, 4 coupons each |
| 5 | Bank offers and festive sales: 2 campaign tiles + bank chips | `bank_offers` (new) | 2 active campaigns, `bank_offers.banks` setting |
| 6 | "How we verify" band | `verify_band` (new) | static copy from section title/subtitle + messages |
| 7 | Newsletter + footer | `newsletter` | existing settings |

Disabled, not deleted, in the migration: `promo_banners`, `trending_stores`, `trusted_brands`, `savings_stats`, `daily_picks`, `popular_categories`, `editorial_tips`, `editorial`, `guarantees`, `faq`.
Their renderers are removed from the page and their component files are deleted.
Git history keeps them.
The admin reorder editor keeps showing disabled rows so an admin can turn one back on later, but a re-enabled legacy section renders nothing until a renderer is restored.
`HowItWorksSection`, which lived outside the admin map, is deleted.

## Backend changes

### Migration `V034__homepage_v2.sql`

1. `alter table coupon add column verified_at timestamptz`.
   Backfill `verified_at = updated_at where verified = true`.
2. Insert `trending_coupons` (position 20, item_limit 7), `bank_offers` (position 50, item_limit 2), `verify_band` (position 60) into `homepage_section` with the mockup titles and subtitles.
3. Re-position: `hero_search` 10, `trending_coupons` 20, `featured_stores` 30 (item_limit 12), `top_deals` 40 (item_limit 4, meaning 4 per tab), `bank_offers` 50, `verify_band` 60, `newsletter` 70.
4. Set `enabled = false` on the ten legacy codes listed above.
5. Insert setting `bank_offers.banks` = `HDFC Bank,SBI Card,ICICI Bank,Axis Bank,Kotak` (public).
6. Update copy on `hero_search` (title "Working coupon codes for every Indian store.", subtitle "No wallet, no tracking, no waiting. Just codes that work.") and `newsletter` (title "Best deals, once a week.", subtitle "The 10 codes worth knowing about. No spam, unsubscribe any time.").

### Coupon

- `Coupon.verifiedAt` (nullable).
  `CouponService` sets it to `now()` whenever `verified` flips from false to true through admin create or update, and clears it when `verified` flips to false.
- `CouponSummary` and `CouponDetail` DTOs gain `verifiedAt`.
- `CouponRepository.countActiveByStoreIds(ids, now)` returns `(storeId, count)` for a batch of stores.
- `CouponRepository.countVerifiedSince(instant)` for the proof line.

### Store

- `StoreSummary` gains `Integer activeCouponCount`, null when the caller did not compute it.
  `HomepageService` fills it in for the stores it returns with one batch query.
  Public `/stores` list fills it too, since the stores page will need it next.

### Campaigns

- `CampaignService.findActive(limit)` returns the active campaigns ordered by `startsAt desc`, up to `limit`.
  Existing `findActive()` delegates with limit 1.
- New `GET /api/v1/campaigns/active-list?limit=2` returns that list.
  The existing single-object `GET /api/v1/campaigns/active` stays untouched.
  The homepage payload embeds the campaigns, so the frontend does not call this endpoint directly; it exists for the campaigns page later.

### Homepage payload

`PublicHomepageDtos.SectionPayload` gains:

- `categoryTabs: List<CategoryTab>` where `CategoryTab = { slug, title, coupons: List<CouponSummary> }`, filled for `top_deals`.
- `campaigns: List<CampaignDtos.Detail>`, filled for `bank_offers`.

`PublicHomepageDtos.Layout` gains `stats: { verifiedLast7d, activeCoupons, activeStores }`.
`HomepageService` resolves:

- `trending_coupons`: active, `verified = true`, order by `popularityScore desc, verifiedAt desc`, limit `item_limit`, with store joined.
- `featured_stores`: pinned stores in pinned order, else top by popularity, limit `item_limit`, with `activeCouponCount`.
- `top_deals`: pinned categories, else first `7` root categories; for each, active coupons in that category by popularity, limit `item_limit`.
- `bank_offers`: `findActive(item_limit)`.
- `hero_search`: `categories` = pinned categories else first 8 roots.

All of this stays inside the existing `homepage.layout` cache entry.
Cache eviction: campaign writes and site-setting writes must also evict `homepage.layout`, in addition to the existing store, coupon and category evictions.

### Tests

- `HomepageServiceTest`: new section codes resolve, `activeCouponCount` and `categoryTabs` populate, disabled sections are absent.
- `CouponServiceTest`: `verifiedAt` set on verify, cleared on unverify.
- `CampaignServiceTest`: `findActive(2)` ordering.

## Frontend changes

### Tokens and primitives

Already in place: Zilla Slab + Inter, `#8529CD` primary, status colours, 6/12/pill radii.
Add to `globals.css`:

- `--clipupp-tint-50: #FAF6FD`, `--clipupp-tint-100: #F5EEFB`, `--clipupp-tint-200: #E7D4F5` with Tailwind aliases `clipupp-tint-50/100/200`.
- `--clipupp-shadow-hover: 0 12px 32px rgba(133,41,205,.10)`.
- Keyframe `clipupp-up` (opacity 0 to 1, translateY 8px to 0), `.clipupp-fx` and `.clipupp-reveal` utilities, both gated behind `prefers-reduced-motion: no-preference`.

### Header (`components/site/Header.tsx`, `HeaderClient.tsx`)

64px, white, 1px bottom border.
Left: `Logo`.
Centre: `HeaderSearch` pill, full width, never collapses to an icon on desktop; on mobile the search field sits on a second row under the wordmark so it stays a field.
Right: Stores, Categories (existing dropdown, kept), Saved, then Sign in (secondary pill) or the user menu (initial avatar, existing dropdown).
Removed from the top bar: category icon strip, locale switcher, Get started.
Mobile drawer keeps the locale switcher and the sign-in / create-account buttons.

### Components (`features/home/components/`)

- `HeroSection.tsx` (server, replaces `HeroSearchSection`): tint-50 band, two-column grid 7/5, eyebrow, H1, subline, `HeroSearch` (client island for autosuggest, GET `/search?q=` without JS), chips, proof line with `ProofCount` (client count-up, 900ms, honours reduced motion), `CouponFan` (3 `CouponCard`s, `aria-hidden`).
  Autosuggest calls the existing search endpoint through `lib/api/search.ts`, debounced 150ms, max 3 rows, shows "No coupons for 'x' yet, try Amazon India" on empty.
- `CouponCard.tsx` in `features/catalog/components/` (one card family, server component with a `ShowCodeButton` client leaf): 40px store logo, type tag, store name, Zilla Slab 22px headline from `savingsLabel` or `title`, scope line from `description`, dashed code pill (blurred until revealed), verify line "Verified Xh ago" in success green when `verifiedAt` is set, usage line when `usedCount >= 50`, 44px primary "Show code".
  Deals without a code render "Get deal".
  `ShowCodeButton`: reveals the code, copies it, opens `/r/{id}` in a new tab so affiliate tracking survives, swaps to "Copied ✓ CODE" for 150ms transition.
  The `row` variant renders the horizontal list layout used in block 4.
- `TrendingCouponsRail.tsx`: section header with eyebrow and "View all trending coupons" link to `/coupons?sort=popular`, horizontal snap rail of `CouponCard`, skeleton shimmer markup for the loading state in `loading.tsx`.
- `TopStoresGrid.tsx`: 6 x 2 grid of store tiles: 56px logo, name, "{n} coupons", deal label from `cashbackRate` (repurposed deal label) in purple.
  Long names wrap with `overflow-wrap: anywhere`.
  Mobile shows 8 and a "View all 500+ stores" link.
- `TabbedCoupons.tsx` (client island, data preloaded): tab row with sliding underline, 2-column rows of `CouponCard` row variant, "See all {Category} coupons" link.
  All tabs arrive in the payload so switching costs no fetch.
- `BankOffersHub.tsx`: two campaign tiles (eyebrow from campaign name and dates, H3 from `heroTitle`, muted line from `heroSubtitle`, link from `ctaLabel`/`ctaUrl` or `/campaigns/{slug}`), bank chip row from the setting.
  Renders nothing when there are no active campaigns.
- `VerifyBand.tsx`: tint-100 band, H2 from section title, three text columns and "See today's checks" secondary button linking to `/coupons?verified=true`.
- `NewsletterBar.tsx`: restyled to the mockup, keeps the existing subscribe action.
- `Footer.tsx`: white, four link columns with full-scope labels (Coupons, Stores, Clipupp, Legal), wordmark and one-line description, bottom row with copyright and "English".
- `MobileBottomNav.tsx`: Home, Stores, Categories, Saved with 48px targets and safe-area padding.

### Page (`app/[locale]/(public)/page.tsx`)

`SECTION_RENDERERS` maps exactly the seven codes.
The alternating-background logic and the fixed `HowItWorksSection` go away; each renderer owns its surface.
Rule kept: exactly one tint-filled block per viewport (hero band, then verify band).
`generateMetadata` and the `WebSite` JSON-LD stay.
H1 remains the LCP element; no image above the fold is larger than a 40px logo.

### Motion

`lib/motion/useReveal.ts`: one IntersectionObserver hook adding `.in`, capped stagger of 6, disabled under reduced motion.
Durations: entrance 500ms, chips 40ms stagger, count-up 900ms, hover 200ms, copied swap 150ms, reveals 400ms.
Transform and opacity only.

### i18n

New copy goes in `messages/en.json` and `messages/hi.json` under `home.*` and `header.*`.
Admin-editable copy (section title/subtitle) wins over message defaults.

### Admin

`HomepageSectionsEditor` `ACCENT_STYLES` gains entries for `trending_coupons`, `bank_offers`, `verify_band`.
Featured editor already supports stores, coupons, categories; no change.

### Deleted files

`HeroSearchSection`, `PromoBannersCarousel(+Client)`, `TrendingStoresRail`, `TrustedBrandsRail`, `SavingsStatsStrip`, `DailyPicksSection`, `PopularCategoriesGrid`, `EditorialTipsSection`, `GuaranteeStrip`, `FaqSection`, `HowItWorksSection`, `BlogSection`.
`DealCard`-style duplicates on the homepage are gone; `CouponSavingsRowCard` stays for other pages until those pages migrate.

## Verification

- Backend: `./gradlew test`.
- Frontend: `npm run typecheck`, `npm run lint`.
- Browser pass with Playwright at 1440 and 390, signed out and signed in, light mode: hero, rail scroll, tab switch, show code copies and opens the redirect, empty search state, keyboard focus rings.
- Lighthouse mobile on `/`: LCP under 2.5s, CLS under 0.1.
- Admin: reorder page still lists all sections, toggling `bank_offers` off hides block 5 after cache eviction.

## Out of scope

Success rate and user feedback votes, Stage 2 mobile-specific mockup refinements beyond what is described here, states board, other pages, Hindi copy quality review.
