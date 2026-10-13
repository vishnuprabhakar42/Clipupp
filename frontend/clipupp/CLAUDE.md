# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Repo-wide notes — including the **5-color theme tokens**, backend modules, and Cloudflare R2 setup — live in `/Users/anshu/Desktop/Clipupp/CLAUDE.md`. Read both when working across stacks.

## First principles

**SEO and page speed are the top priorities for every frontend change.**

- **Prefer server components.** Keep `"use client"` at the leaves. Data fetching belongs in server components so HTML arrives pre-rendered — never block the initial paint with a client-side `useEffect` fetch.
- **Static > dynamic where possible.** Use `generateStaticParams` for store/coupon/category pages. Fall back to ISR (`revalidate`) rather than full SSR when data changes infrequently.
- **Images must use `next/image`** with explicit `width`/`height` (or `fill` + sized parent). Always add `priority` on above-the-fold images (hero, top store logos). Lazy-load everything else.
- **No layout shift.** Every image container must have a fixed dimension or aspect ratio (see Image render contract). Skeleton loaders must match the final element's dimensions exactly.
- **Structured data.** Store and coupon pages should emit JSON-LD (`WebSite`, `Organization`, `Product`, `Offer` schemas). Don't remove or skip it when editing those pages.
- **`<head>` hygiene.** Every page must have a unique `<title>`, `<meta name="description">`, and canonical `<link>`. Use shared metadata helpers in `lib/seo/` — never hardcode meta tags inline.
- **Minimize JS sent to the browser.** Don't pull heavy client libraries into shared layouts. If a component is only needed on one page, import it locally.
- **No `"use client"` on layout files.** A client layout forces every child into the client bundle.

## Commands

```bash
npm run dev          # dev server on :3000
npm run build        # production build (type/lint errors NOT surfaced — see below)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (explicit — next.config.mjs suppresses build-time errors)
```

No test suite is configured. `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` — run `npm run typecheck` and `npm run lint` explicitly when you need a real check.

## Architecture

**Next.js 15 App Router** with route groups (all nested under `app/[locale]/`):
- `(public)/` — home, stores, coupons, offers, categories, blog, search, newsletter, legal pages
- `(auth)/` — sign-in, sign-up, forgot-password, reset-password, verify-email
- `(authed)/` — `/account/*` (overview, profile, preferences, saved-coupons, click-history); requires active session
- `(admin)/` — full admin portal at `/admin`; requires **ADMIN** role specifically (SUPER_ADMIN alone is NOT sufficient — every endpoint uses `@PreAuthorize("hasRole('ADMIN')")`)
- OG image routes: `/og/store/[slug]`, `/og/coupon/[slug]` — edge runtime, can't read CSS vars, see Design section.

**Feature modules** (`features/`):
- `auth/` — SignInForm, SignUpForm, ForgotPasswordForm, ResetPasswordForm, ChangePasswordForm, ProfileForm, PreferencesForm + Zod schemas
- `catalog/` - CouponList, StoreFilters, CouponReveal, CouponCountdown, HeaderSearch (combobox with `default`/`pill`/`hero` variants), plus the homepage v3 coupon family: **CouponCard** (async server, `card` ticket stub; `variant="row"` delegates to the sync **CouponRow**), **RevealButton** (peel cover, copies on click), **CouponSheet** (`CouponSheetProvider`, mounted once in the locale root layout and closed on route change, state in `lib/home/useCouponSheet.ts`), SaveHeart, StoreTile + LogoImage (logo with monogram fallback), `cardBits.tsx` (shared hover + Tag). `CouponSavingsCard`, `ShowCodeButton` and the legacy card were deleted.
- `admin/` — NewStoreForm, NewCouponForm, NewCategoryForm, NewNetworkForm, NewMerchantLinkForm, NewBannerForm, AdminPageHeader, AdminNavLink, UserRoleControls, **AnalyticsDashboard** (KPI tiles + Recharts area/bar/pie, server-renders 7 fetches via `Promise.all`), **HomepageSectionsEditor** (drag-reorder 8 home sections via `@dnd-kit`, expand-to-edit, `ACCENT_STYLES` map keyed by the 5 brand roles), **BannersReorderEditor** (drag-reorder list, posts to `/api/v1/admin/banners/reorder`), **FeaturedItemsEditor**, **CampaignForm**, **CouponImportWizard**, **SettingsForm**, ImageUploader (uploads via `mediaApi.upload` → R2)
- `home/` - homepage v3 (one component per block, rendered from `SECTION_RENDERERS` in `app/[locale]/(public)/page.tsx` in `feed.sectionOrder`): AnnouncementStrip, CategoryRail, HeroSection (+ SpotlightCarousel), LiveTicker, PopularStoresStrip, TrendingRail, DealsRail, TodaysCoupons, BankOffersRail, SaleCalendarRail, TopStoresGrid, VerifyBand, AlertsSection (+ NewsletterForm, TelegramLinkButton), FaqSection (FAQPage JSON-LD), SavedSheet. Rails hold server-rendered cards and filter on the client. All v2 sections (NewsletterBar, HeroSearch, TabbedCoupons, BankOffersHub, CouponFan, etc.) were deleted.
- Homepage data: `lib/home/getHomeFeed.ts` -> `lib/home/adapter.ts` (`toHomeFeed`) maps the backend layout + settings into the `HomeFeed` contract (`lib/home/feed.ts`). With `NEXT_PUBLIC_HOME_DEMO_FEED` (default on in development) gaps are filled from `features/home/fixtures/demo-feed.json` and the fixture section order is used. Cross-block events (rail chip to Today tab, store filter, refresh) go through `lib/home/homeBus.ts`. Links to a homepage block (`/#bank`, `/#deals`, ...) from the nav, footer, strip or search go through `lib/home/anchors.ts` (`anchorFor(id, renderedAnchors(feed))`), which falls back to a route or hides the link when the block does not render.
- `newsletter/`, `savedcoupons/` (SaveCouponButton, SavedCouponCard, AccountNavLink), `site/` (InfoPageShell)

**Authentication (backend-driven JWT, NOT NextAuth):**
- Java backend (`:8080`) owns all auth. Frontend never connects to a database directly.
- Login POSTs to `/api/v1/auth/login` → backend returns `accessToken` + sets `clipupp_rt` HttpOnly cookie.
- Access token stored in-memory (`lib/auth/token-store.ts`); auto-refreshed on 401 by `lib/api/client.ts`.
- **All refresh attempts must go through `lib/auth/refresh.ts:refreshAccessToken()` singleton.** Direct calls race with each other and trip the backend's replay-detection. Note: `/api/v1/auth/refresh` is **non-rotating** — it issues a fresh access token but keeps the same refresh token. Only login rotates.
- `components/providers/AuthProvider.tsx` exposes `useAuth()` context.
- Server components call `lib/auth/server.ts:getServerSession()` which reads the `clipupp_rt` cookie + hits `/users/me`. Wrapped in `cache()` so it's safe to call multiple times per request.
- Server-side authenticated fetches use `lib/account/server-fetch.ts:accountFetch<T>(path)` — handles refresh + bearer auth in one call.
- Roles: `USER`, `ADMIN`, `SUPER_ADMIN`, `MERCHANT`. **Important:** ADMIN and SUPER_ADMIN are not hierarchical in the backend's `@PreAuthorize` checks. Grant `ADMIN` explicitly via SQL (`user_role` table, NOT `app_user_role`).

**Data layer:**
- `lib/api/client.ts` — base HTTP client (fetch-based, not axios). Auto-refreshes access token on 401 via the shared singleton.
- `lib/api/{auth,users,stores,coupons,categories,admin,banners,newsletter,savedCoupons,search,analytics,homepage,settings,media,legalPages}.ts` — typed endpoint modules
- `lib/api/types.ts` — all DTO types (CouponSummary, StoreDetail, AdminUserRow, CursorPage, SpringPage, etc.)
- Public endpoints use cursor-based pagination (`CursorPage<T>`); admin endpoints use Spring's offset pagination (`SpringPage<T>`).

**Admin portal** (`app/[locale]/(admin)/admin/`):
- Sidebar groups: Dashboard | Site (homepage, banners, campaigns, settings) | Catalog (stores, coupons, categories, import) | Content (blog, authors, legal pages) | Affiliates (networks, merchant-links, clicks, conversions) | People (users, newsletter).
- Fully wired to backend `/api/v1/admin/**` endpoints via `lib/api/admin.ts`.
- Drag-reorder: `homepage` page uses `HomepageSectionsEditor`, `banners` page uses `BannersReorderEditor`. Both POST to dedicated reorder endpoints on the backend.
- Dashboard server-renders 7 analytics fetches in parallel — no client waterfalls.

**i18n:** `next-intl` with `[locale]` URL prefix; locale also persisted in `clipupp_locale` cookie. Config in `lib/i18n/`.

**UI:** shadcn/ui (`components/ui/`) + Tailwind CSS + Framer Motion + Embla Carousel. Dark mode: `components/providers/ThemeProvider.tsx` (next-themes, `data-theme` attribute) themes only the homepage; every other route gets `forcedTheme="light"` (add a path to `THEMED_PATHS` to migrate it). Dark tokens live in `app/globals.css` in two blocks that must stay identical.

**Typography:** Zilla Slab (headings) + Inter (UI and body), both loaded via `next/font/google` in `app/[locale]/layout.tsx` as `--font-display` and `--font-sans`. Use `font-display` on headings; figures inside headings use `.clipupp-num` (Inter) so the slab never renders old-style digits.

**Path alias:** `@/*` → project root (`frontend/clipupp/`), not `src/`.

## Design system — Rakuten-inspired single-purple palette

The site uses a **single-brand-purple, flat palette** (modeled on rakuten.com) defined in `app/globals.css` `:root` as CSS variables, with matching Tailwind aliases in `tailwind.config.ts`. One purple drives every action; status colors are used **only** for status. No gradients except the homepage hero band and the coupon-CTA sheen. Adding a new role is a design decision, not a free-form choice.

| Role | Name | Mid | Strong | Soft | Foreground | Tailwind aliases |
|---|---|---|---|---|---|---|
| Primary | Purple | `#8529CD` | `#7119B8` | `#F4F3FE` | `#ffffff` | `clipupp-primary`, `clipupp-primary-strong`, `clipupp-primary-soft`, `clipupp-primary-fg` |
| Accent | (= Primary) | `#8529CD` | `#7119B8` | `#F4F3FE` | `#ffffff` | `clipupp-accent*` — **collapsed to primary** (single-accent system) |
| Success | Green | `#33823F` | `#134028` | `#ECF6EE` | `#ffffff` | `clipupp-success`, `clipupp-success-strong`, `clipupp-success-soft`, `clipupp-success-fg` |
| Danger | Red | `#B90037` | `#720827` | `#FCE7EE` | `#ffffff` | `clipupp-danger`, `clipupp-danger-strong`, `clipupp-danger-soft`, `clipupp-danger-fg` |
| Warning | Orange | `#EE6B00` | `#AE5308` | `#FFF3E0` | `#ffffff` | `clipupp-warning*` |
| Info | Indigo | `#3E3E9D` | — | `#ECECF8` | — | `clipupp-info`, `clipupp-info-soft` |
| Neutral | Warm grey | `#252525` (text) … `#FAFAFA` (bg) | | | | `clipupp-neutral-{0,50…900}` |

Fonts: **Zilla Slab** (slab-serif display/headings, open match to Rakuten's Stag) + **Inter** (body/UI), loaded via `next/font` in `app/[locale]/layout.tsx` and exposed as `--font-display` / `--font-sans`. Shadows are tinted with indigo `#0a1646`, not black.

**Single source of truth:** every value lives in `globals.css` as a CSS var. Tailwind's numbered scale (`clipupp-primary-700`, etc.) reads the per-step `--clipupp-*-rgb` triplets — there are **no literal hex color scales in `tailwind.config.ts`**. (This was the old "Crimson + Amber" bug: config literals disagreed with the vars. Never reintroduce literal hex scales in the config.)

- **Semantic role tokens** (`--color-text`, `--color-text-muted`, `--color-action`, `--color-cta`, `--color-surface`, `--color-border`, `--color-success/error/warning/info`) sit on top of the scale. Prefer these intent-named roles in new components over raw scale steps.
- shadcn semantic tokens (`--primary`, `--accent`, `--destructive`, `--ring`, `--secondary`, `--muted`) are re-pointed to the purple palette in `globals.css`, so every shadcn primitive in `components/ui/*` auto-skins.
- Use `bg-clipupp-primary` / `text-clipupp-neutral-600` / `border-clipupp-neutral-200` everywhere. **Do not introduce raw hex.**
- CTAs are **flat** (`.clipupp-btn-primary-gradient` and `.clipupp-coupon-cta` resolve to solid purple despite the legacy `-gradient` names). The coupon CTA slide-reveal + sheen are interactions, not gradient fills.
- Two **legitimate hex exceptions** (both mirror `--clipupp-*` and must be kept in sync):
  1. `app/og/{coupon,store}/[slug]/route.tsx` — edge runtime cannot read CSS variables; each route mirrors the palette inline (purple `#8529CD` / `#7119B8`).
  2. `features/admin/components/AnalyticsDashboard.tsx` — Recharts SVG `<Cell fill>` / `<stopColor>` props don't resolve CSS vars at render. `PIE_COLORS`, the `accentMetric` map, and the bar/area `<linearGradient>` stops are inline literal hex from the palette (`#8529CD` purple, `#33823F` green, `#3E3E9D` indigo, `#EE6B00` orange, `#575757` grey).

**`HomepageSectionsEditor` accent contract:** `ACCENT_STYLES` is keyed by `"primary" | "accent" | "success" | "danger" | "neutral"` — exactly the 5 brand roles. When adding a new homepage section type, choose one of these 5 — don't introduce a 6th hue.

## Image render contract

Every store-logo / banner-image render site must:
1. Use **`overflow-hidden`** on a fixed-dimension parent (`h-N w-N` or `aspect-X`).
2. Use **`object-contain`** (preserves aspect) or **`object-cover`** (crops to fill) on the `<img>`.
3. Size the `<img>` with **`h-full w-full`** or **`max-h-X max-w-X`** — never `max-w-full` alone.

Admin uploaders (`NewStoreForm`, `NewBannerForm`) cap their preview at `max-w-[220px]` / `max-w-[560px]` to prevent giant high-res uploads from filling the form.

## Important conventions

- **Cache eviction:** writes to `store`, `coupon`, or `category` must evict **both** `homepage.top` AND `homepage.layout` on the backend. The trending rail and featured grid read embedded data from the layout cache; busting only `homepage.top` leaves stale logos/titles.
- **Saved-coupon optimistic flips** use `router.refresh()` after mutating; the cursor API doesn't return totals so the sidebar count needs a server re-read.
- **`SECTION_RENDERERS` map** in `app/[locale]/(public)/page.tsx` keys must match `homepage_section.code` values. The trending_stores section is pulled out of the iteration and rendered above everything else only when `getServerSession()` returns a user.
- **Section anchors:** every public homepage section wraps in `<div id={s.code} className="scroll-mt-24">` so the admin homepage editor's "Preview" button can deep-link.
- **Drag-reorder components** must be wrapped in `dynamic({ ssr: false })` because `@dnd-kit/sortable`'s internal accessibility IDs are non-deterministic and trip hydration. See `HomepageSectionsEditorLazy.tsx`, `BannersReorderEditorLazy.tsx`.
- **Phase 1 = coupons only.** Cashback is deferred. User-facing copy says "deals" / "coupons" / "save", never "cashback". The `cashbackRate` field on the store DTO is now used as a generic "deal label" string (admin form labels it that way).

## Required Environment Variables

```
NEXT_PUBLIC_API_BASE_URL     # client-side API base URL (default: http://localhost:8080)
BACKEND_URL                  # server-side API base URL
```

`next.config.mjs` rewrites `/api/v1/:path*`, `/r/:path*`, `/postback/:path*`, `/v3/api-docs/:path*`, `/swagger-ui/:path*`, `/actuator/:path*` to `BACKEND_URL` so the browser always sees same-origin requests (critical for the `clipupp_rt` cookie path).

Image remote patterns in `next.config.mjs`: `*.r2.dev`, `*.r2.cloudflarestorage.com`, `**.cloudfront.net`, `logo.clearbit.com`, `images.unsplash.com`, `api.dicebear.com`, `upload.wikimedia.org`, `placehold.co`. Add new hosts here before using `next/image` against them.
