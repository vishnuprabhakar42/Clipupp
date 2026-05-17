# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Polyglot monorepo — two independent projects, no shared build tooling or lockfiles.

```
CouponValley/
├── backend/couponvalley/    # Java 21 / Spring Boot 4.0.6 (Gradle)
└── frontend/couponvalley/   # Next.js 15 (App Router) + React Query + custom JWT auth
```

Only `frontend/couponvalley/` is a git repository. Always `cd` into the project you are touching before running any command.

---

## First principles

**SEO and page speed are the top priorities for every frontend change.**

- **Prefer server components.** Keep `"use client"` at the leaves. Data fetching belongs in server components so HTML arrives pre-rendered — never block the initial paint with a client-side `useEffect` fetch.
- **Static > dynamic where possible.** Use `generateStaticParams` for store/coupon/category pages. Fall back to ISR (`revalidate`) rather than full SSR when data changes infrequently.
- **Images must use `next/image`** with explicit `width`/`height` (or `fill` + sized parent). Always add `priority` on above-the-fold images (hero, top store logos). Lazy-load everything else.
- **No layout shift.** Every image container must have a fixed dimension or aspect ratio (see Image render contract below). Skeleton loaders must match the final element's dimensions exactly.
- **Structured data.** Store and coupon pages should emit JSON-LD (`WebSite`, `Organization`, `Product`, `Offer` schemas). Don't remove or skip it when editing those pages.
- **`<head>` hygiene.** Every page must have a unique `<title>`, `<meta name="description">`, and canonical `<link>`. Use the shared metadata helpers in `lib/seo/` (or create them there if missing) — never hardcode meta tags inline in a page.
- **Minimize JS sent to the browser.** Don't pull heavy client libraries into shared layouts. If a component is only needed on one page, import it locally.
- **No `"use client"` on layout files.** A client layout forces every child into the client bundle.

---

## Frontend (`frontend/couponvalley/`)

### Commands

```bash
cd frontend/couponvalley
npm run dev          # dev server on :3000
npm run build        # production build (type/lint errors NOT surfaced — see below)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (explicit — next.config.mjs suppresses build-time errors)
npm run openapi:gen  # regenerate lib/api/generated/schema.ts from backend OpenAPI spec (requires backend running on :8080)
```

### Architecture

**Route groups** (all under `app/[locale]/`):
- `(public)/` — home, stores, coupons, offers, categories, blog, search, newsletter, legal pages
- `(auth)/` — sign-in, sign-up, forgot-password, reset-password, verify-email
- `(authed)/` — `/account/*` (profile, preferences, saved-coupons, click-history)
- `(admin)/` — full admin portal (see Admin section below)
- OG image routes: `/og/store/[slug]`, `/og/coupon/[slug]`

**Feature modules** (`features/`):
- `auth/` — SignInForm, SignUpForm, ForgotPasswordForm, ResetPasswordForm, ChangePasswordForm, ProfileForm, PreferencesForm + Zod schemas
- `catalog/` — CouponList, StoreFilters, CouponReveal, CouponCountdown, CouponShareMenu, HeaderSearch, CouponSavingsCard
- `admin/` — NewStoreForm, NewCouponForm, NewCategoryForm, NewNetworkForm, NewMerchantLinkForm, NewBannerForm, AdminPageHeader, AdminNavLink, UserRoleControls, ImageUploader, **AnalyticsDashboard**, **HomepageSectionsEditor** (8 home sections, drag-reorder, ACCENT_STYLES map, live preview), **BannersReorderEditor** (drag-reorder list), **FeaturedItemsEditor**, **CampaignForm**, **CouponImportWizard**, **SettingsForm**
- `home/` — HeroBanner, TopStoresGrid, TopCouponsRail, **TrendingStoresRail** (sign-in only, pinned to top), **PromoBannersCarousel** (2-up sliding track + arrows + N/total counter), FeaturedStoresGrid, TopDealsSection, TrustedBrandsRail, PopularCategoriesGrid, BlogSection, NewsletterBar, AnnouncementBar
- `newsletter/`, `savedcoupons/`, `site/`

**Data layer:**
- `lib/api/client.ts` — base HTTP client with automatic 401 → refresh token retry (single-flight via `lib/auth/refresh.ts`)
- `lib/api/{auth,users,stores,coupons,categories,admin,banners,newsletter,savedCoupons,search,analytics,homepage,settings,media,legalPages}.ts` — typed endpoint modules
- `lib/api/types.ts` — all DTO types (CouponSummary, StoreDetail, AdminUserRow, etc.)
- `lib/account/server-fetch.ts:accountFetch<T>(path)` — server-side authenticated fetch (handles refresh + bearer auth in one call; use this in server components that need the user's session)
- Pagination is cursor-based for public endpoints (`CursorPage<T>`) and offset-based for admin (`SpringPage<T>`)

**Authentication (backend-driven JWT, NOT NextAuth):**
- Java backend owns auth. Frontend never touches a DB directly.
- Login POSTs to `/api/v1/auth/login` → backend returns `accessToken` + sets `cv_rt` HttpOnly cookie (refresh token, **non-rotating** on `/refresh` to avoid replay-detection races; rotates only on login).
- Access token lives in-memory (`lib/auth/token-store.ts`); never in localStorage.
- `AuthProvider.tsx` holds `useAuth()` context; auto-refreshes on 401 via `lib/api/client.ts`.
- All refresh calls go through `refreshAccessToken()` singleton in `lib/auth/refresh.ts` — never write your own; concurrent rotations trip the backend's replay detection.
- Server components call `lib/auth/server.ts:getServerSession()` (reads `cv_rt` cookie + `/users/me`, `cache()`-wrapped).
- Roles: `USER`, `ADMIN`, `SUPER_ADMIN`, `MERCHANT`. **Important:** ADMIN and SUPER_ADMIN are *not* hierarchical — every admin endpoint uses `@PreAuthorize("hasRole('ADMIN')")`, so a SUPER_ADMIN-only user gets 403 on most APIs. Grant the `ADMIN` role explicitly.

**Admin portal** (`app/[locale]/(admin)/admin/`):
- Protected by server-side role check (ADMIN or SUPER_ADMIN) in the layout.
- Sidebar groups: Dashboard | Site (homepage layout, banners, campaigns, settings) | Catalog (stores, coupons, categories, CSV import) | Content (blog, authors, legal pages) | Affiliates (networks, merchant-links, clicks, conversions) | People (users, newsletter).
- Dashboard at `/admin` server-renders 7 analytics fetches in one `Promise.all` (no client-side waterfalls). Includes 4 hero KPI tiles, 4 mini-tiles, time-series area chart with metric toggle, top stores bar chart, top coupons table, funnel with progress bars, network breakdown donut + table.
- `/admin/homepage` renders sortable section list via `HomepageSectionsEditor` (sortable, expand-to-edit, status mini-bar at top). Editor uses an `ACCENT_STYLES` map keyed by the 5 brand roles.
- `/admin/banners` renders sortable `BannersReorderEditor`. Drag-reorder posts to `POST /api/v1/admin/banners/reorder`.
- Banner image uploads land in Cloudflare R2 via `MediaController.upload` → `mediaApi.upload(file)`.

**i18n:** `next-intl` with `[locale]` URL prefix; locale also stored in `cv_locale` cookie. Config in `lib/i18n/`.

**UI:** shadcn/ui (`components/ui/`) + Tailwind CSS + Framer Motion + Embla Carousel. Dark mode partially scaffolded (`darkMode: ["class"]` in tailwind config) but no `next-themes` provider — site is effectively **light mode only** today.

**Path alias:** `@/*` → project root (`frontend/couponvalley/`), not `src/`.

### Design system — 3-color "Vivid" theme

The site uses a strict **3-color "Vivid" palette** defined in `app/globals.css` `:root` as CSS variables, with matching Tailwind aliases in `tailwind.config.ts`. Every brand surface anywhere on the site must reach for one of these roles — adding a new role is a design decision, not a free-form choice.

| Role | Name | Mid | Strong | Soft | Foreground | Tailwind |
|---|---|---|---|---|---|---|
| Primary | Violet | `#5B21B6` | `#4C1D95` | `#F5F3FF` | `#ffffff` | `cv-primary`, `cv-primary-strong`, `cv-primary-soft`, `cv-primary-fg` |
| Accent | Orange | `#F97316` | `#EA580C` | `#FFF7ED` | `#ffffff` | `cv-accent`, `cv-accent-strong`, `cv-accent-soft`, `cv-accent-fg` |
| Success | Emerald | `#10b981` | `#059669` | `#ecfdf5` | `#ffffff` | `cv-success`, `cv-success-strong`, `cv-success-soft`, `cv-success-fg` |
| Danger | Red | `#DC2626` | `#B91C1C` | `#fef2f2` | `#ffffff` | `cv-danger`, `cv-danger-strong`, `cv-danger-soft`, `cv-danger-fg` |
| Neutral | Slate | scale | scale | scale | scale | `cv-neutral-{50…900}` (10-step) |

Pending / expiring / urgency / "hot deal" states use **Accent** (orange). Real errors and destructive actions use **Danger**. Chrome (text, borders, surfaces) uses **Neutral**.

**Token contract:**
- shadcn semantic tokens (`--primary`, `--accent`, `--destructive`, `--ring`, `--secondary`, `--muted`) are re-pointed to the 5-color palette in `globals.css`, so every primitive in `components/ui/*` auto-skins.
- Helper utility classes that read from the new vars: `.cv-btn-primary`, `.cv-btn-ghost`, `.cv-gradient-text`, `.cv-color-strip`, `.cv-section-title`, `.cv-section-link`, `.cv-card`, `.cv-skeleton`, `.cv-pill`.
- Use `bg-cv-primary` / `text-cv-accent-strong` / `border-cv-neutral-200` for everything. **Do not** introduce raw hex inline.

**Two places that legitimately use literal hex (and a sync warning):**
- `app/og/{coupon,store}/[slug]/route.tsx` — edge runtime can't read CSS vars, so each has a `CV = { primary: "#5B21B6", primaryStrong: "#4C1D95", accent: "#F97316" } as const` block at the top mirroring the palette. Update when `globals.css` changes.
- `features/admin/components/AnalyticsDashboard.tsx` — Recharts `<Cell fill>` and `<stopColor>` props don't resolve CSS vars at render. `PIE_COLORS = ["#5B21B6","#F97316","#10b981","#DC2626","#475569"]`, the `accentMetric` map, and the bar/area `<linearGradient>` stops are inline literal hex, mirrors of the same palette.

**`HomepageSectionsEditor` `ACCENT_STYLES` map:** keyed by `"primary" | "accent" | "success" | "danger" | "neutral"` — exactly the 5 brand roles. Each section type maps to one role (`promo_banners → primary`, `trending_stores → accent`, `top_deals → accent`, `featured_stores → accent`, `popular_categories → success`, `trusted_brands → primary`, `editorial → neutral`, `newsletter → accent`).

### Required env vars

```
NEXT_PUBLIC_API_BASE_URL     # API base URL for client-side fetches (default: http://localhost:8080)
BACKEND_URL                  # API base URL for server-side fetches
```

`next.config.mjs` rewrites `/api/v1/:path*`, `/r/:path*`, `/postback/:path*`, `/v3/api-docs/:path*`, `/swagger-ui/:path*`, and `/actuator/:path*` to `BACKEND_URL`, so browsers always see same-origin requests. This is critical for the `cv_rt` HttpOnly cookie — it must be same-origin to be sent automatically.

---

## Backend (`backend/couponvalley/`)

### Commands

```bash
cd backend/couponvalley
./gradlew bootRun                              # run on :8080 (dev profile auto-activated)
./gradlew build                               # compile + test + jar
./gradlew test                                # all tests
./gradlew test --tests 'com.couponvalley.auth.*'   # single package
```

**Env-var gotcha with Gradle:** the long-running Gradle daemon caches its environment at launch. Setting `R2_BUCKET=... ./gradlew bootRun` will be silently ignored if a daemon is already running. Fix: `./gradlew --stop && ./gradlew --no-daemon bootRun`, or bake values into `application-dev.yml` (see R2 section below).

### Architecture

Spring Boot 4.0.6 / Java 21. Hexagonal layout: each module has `api/`, `application/`, `domain/`, `infra/` sub-packages.

**Modules:**

| Package | Controllers | Key classes |
|---|---|---|
| `auth` | `AuthController` | `AuthService`, `TokenService`, `JwtIssuer`, `JwtAuthenticationFilter` |
| `users` | `UsersController` | `UserService`, `AppUser`, `UserPreference` |
| `stores` | `PublicStoresController` | `StoreService`, `Store`, `Stats`, `Faq`, `ContentWriter` |
| `coupons` | `PublicCouponsController`, `PublicOffersController` | `CouponService`, `Coupon` |
| `categories` | `PublicCategoriesController` | `CategoryService`, `Category` (self-referential tree) |
| `blog` | `PublicBlogController` | `BlogService`, `Article`, `Author` |
| `banner` | `PublicBannersController` | `BannerService`, `Banner`. Bulk-reorder via `BannerService.reorder(List<UUID>)`. |
| `affiliates` | `AdminAffiliateNetworkController` | `AffiliateAdminService`, pluggable `NetworkAdapter` (Admitad/Awin/CJ/Impact/Rakuten/Stub) |
| `conversions` | `PostbackController` | `PostbackService`, HMAC verification |
| `clicktrack` | `RedirectController`, `AccountClicksController` | `ClickService`, Caffeine-backed redirect cache |
| `savedcoupons` | `AccountSavedCouponsController` | `SavedCouponService` |
| `newsletter` | `PublicNewsletterController` | `NewsletterService`, double opt-in flow |
| `notifications` | — | `EmailDispatcher`, pluggable `EmailAdapter` (Resend prod / Logging dev) |
| `search` | `SearchController` | `SearchService`, PostgreSQL full-text + trigram |
| `seo` | `SitemapController` | Dynamic XML sitemaps |
| `home` | `PublicHomepageController`, `AdminHomepageController` | `HomepageService`, layout API. **Cache name: `homepage.layout`.** |
| `analytics` | `AdminAnalyticsController` | Materialised views + `AnalyticsRefresher` |
| `admin` | `AdminStoresController`, `AdminCouponsController`, `AdminCategoriesController`, `AdminBannersController`, `AdminBlogController`, `AdminUsersController`, `AdminClicksController`, `AdminConversionsController`, `AdminNewsletterController`, `AdminMerchantNetworkLinkController`, `AdminSiteSettingsController`, `AdminLegalPagesController`, `AdminCampaignsController` | Full CRUD + analytics for all entities |
| `media` | `MediaController` | `MediaService` — uploads to Cloudflare R2 via AWS SDK v2. **R2 requires path-style addressing** (configured in `MediaConfig.s3Client`); host-style is the AWS default and silently 404s on R2. |
| `dev` | `DevSeedController` | `DevSeedService` (regular seed: stores/coupons/etc.), **`DevAnalyticsSeederService`** (bulk-seeds tens of thousands of users / clicks / conversions for dashboard demos). Both are `@Profile("dev")` only. |
| `common` | `PingController` | `SecurityConfig`, `CacheConfig`, `OutboxService`, `AuditLogService`, `AuditableEntity` |

**Cross-cutting infrastructure:**
- **Outbox pattern:** `OutboxService.enqueue()` (MANDATORY propagation) writes to `outbox` table inside the business tx; `OutboxPoller` (@Scheduled every 5 s) drains it via `OutboxDispatcher` → topics like `email.send`, `sitemap.dirty`, `search.reindex`. `OutboxPoller.drain()` uses `@Lazy` self-injection so each `processOne()` runs in its own `@Transactional` proxy (avoids an infinite-loop bug from direct method calls).
- **Audit log:** `AuditLogService.record()` is best-effort (swallows exceptions). Stores actor, action, target, IP, user-agent, JSONB metadata.
- **JPA auditing:** `AuditableEntity` base class auto-populates `created_at`, `updated_at`, `created_by`, `updated_by` via `@EnableJpaAuditing(auditorAwareRef = "auditAware")`.
- **Caching:** Caffeine (single-node, 10 min TTL, 10 k entries). Active cache regions: `store.detail`, `coupon.detail`, `category.tree`, `homepage.top`, `homepage.layout`, `coupon.redirect`, `search.suggest`, `analytics.summary`, `site.settings.public`, `legal.page`.
- **Important cache-eviction rule:** any write that affects what the home page renders MUST evict both `homepage.top` AND `homepage.layout`. The trending rail and featured grid read embedded store/coupon/category data from the cached `homepage.layout`, so a store-logo update that only busts `homepage.top` will keep showing the stale image. `StoreService`, `CouponService`, and `CategoryService` already wire both into their `@CacheEvict` lists.
- **Analytics materialised views:** refreshed every 15 min by `AnalyticsRefresher`. Uses raw `DataSource` connection with `setAutoCommit(true)` + `Statement.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY …")` — JPA's `Query.executeUpdate()` throws `TransactionRequiredException` for this because `CONCURRENTLY` can't run inside a managed tx.
- **Rate limiting:** Bucket4j per-IP on auth + redirect endpoints.
- **Security:** Default-deny. Public allowlist in `SecurityConfig`. Bearer JWT in `Authorization` header; refresh token in `cv_rt` HttpOnly cookie. BCrypt-12 for passwords. `/api/v1/dev/**` is `permitAll` so the dev seed endpoints work without auth.

**API surface summary:**
- Public: `/api/v1/stores/**`, `/api/v1/coupons/**`, `/api/v1/offers/**`, `/api/v1/categories/**`, `/api/v1/blog/**`, `/api/v1/banners/**`, `/api/v1/search/**`, `/api/v1/newsletter/**`, `/api/v1/homepage`, `/api/v1/settings/public`, `/api/v1/legal-pages/{slug}`, `/r/{couponId}`, `/postback/{network}`
- Auth: `/api/v1/auth/**` (register, login, refresh, logout, verify-email, forgot-password, reset-password)
- Authenticated user: `/api/v1/users/me/**`, `/api/v1/account/**`
- Admin (requires ADMIN role; SUPER_ADMIN alone is NOT enough — see Roles note above): `/api/v1/admin/**`
- Media upload (admin): `POST /api/v1/media/upload` (multipart)
- Banner reorder (admin): `POST /api/v1/admin/banners/reorder` body `{ ids: ["uuid", ...] }`
- Homepage reorder (admin): `POST /api/v1/admin/homepage/sections/reorder` body `{ ids: ["uuid", ...] }`
- Dev (dev profile only): `POST /api/v1/dev/seed` (entity seed), `POST /api/v1/dev/seed-analytics?users=3000&clicks=80000&conversions=3500&days=90` (bulk-seeds synthetic users/clicks/conversions for the admin dashboard, refreshes materialised views on completion)
- Health/docs: `/actuator/health`, `/v3/api-docs`, `/swagger-ui.html`

### Database

PostgreSQL. Flyway runs automatically on startup (`classpath:db/migration`, **V001–V027** plus one repeatable `R__seed_dev_data.sql`).

**Migration timeline (recent):**
- V001-V009: core schema (users/auth, stores, categories, coupons, clicks, conversions, blog, banners)
- V010: brand colours + banner placement (HERO_CAROUSEL / TOP_BAR / PROMO_CARD)
- V011: dev banner seed (TOP_BAR + PROMO_CARD)
- V012-V013: store cashback fields (now repurposed — see "Coupons-only Phase 1" below)
- V014: legal pages
- V015: `homepage_section` table + 7 default sections (`trending_stores`, `promo_banners`, `featured_stores`, `top_deals`, `editorial`, `popular_categories`, `newsletter`)
- V016: `site_setting` key/value table
- V017: analytics materialised views (`mv_clicks_daily`, `mv_conversions_daily`, `mv_signups_daily`, `mv_top_stores_30d`, `mv_top_coupons_30d`) + `REFRESH ... CONCURRENTLY` permissions
- V018: campaigns
- V019: perf indexes
- V020: featured stores defaults
- V021: `trusted_brands` 8th homepage section
- V022: reorder promo banners section above trending stores
- V023: seed 10 PROMO_CARD banners (Unsplash imagery, idempotent — only inserts when no live banner exists)
- V024: clean up `placehold.co` banner URLs; seed real Unsplash images
- V025: strip "cashback" wording from seeded banner copy + `site_setting` rows (Phase 1 is coupons-only)
- V026: real imagery for stores (Clearbit logos via `primary_url` regex) + authors (DiceBear avatars) + article hero images (Unsplash). **Note: the `author` table column is `avatar_url`, not `image_url`** — easy to misread.
- V027: revert imagery to placehold (Clearbit/Unsplash URLs weren't loading reliably; restores branded coloured tiles with abbreviation text)
- `R__seed_dev_data.sql`: full dev fixture — stores, coupons, categories, banners, articles, etc.

**Key schema facts:**
- `app_user.email` is `CITEXT` (case-insensitive; requires `citext` extension — enabled in V001).
- Stores and coupons have `search_tsv` (TSVECTOR) + trigram indexes for full-text search.
- Affiliate postback secrets stored as pgcrypto-encrypted BYTEA.
- Soft-delete via `deleted_at` + `status` on stores, coupons, articles.
- Refresh token table implements rotation chains with replay-detection via `parent_id`. **Critical:** `/api/v1/auth/refresh` is **non-rotating** (uses `TokenService.issueAccessOnly` + `validateRefreshWithoutRotating`) to avoid races between concurrent refresh attempts from frontend modules. Login does still rotate.
- Roles table is named **`user_role`** (NOT `app_user_role`). Grant admin: `INSERT INTO user_role (user_id, role) SELECT id, 'ADMIN' FROM app_user WHERE email = '<email>' ON CONFLICT DO NOTHING;`
- `homepage_section.code` is the FK that the public `/api/v1/homepage` response uses; frontend's `SECTION_RENDERERS` map keys must match.

`spring.jpa.hibernate.ddl-auto=none` — Hibernate never touches the schema; Flyway owns it.

### Coupons-only Phase 1 (no cashback)

Phase 1 ships **coupon codes + deal links only**. Cashback functionality is deferred to a future phase. The cashback column names (`cashback_rate` on store, `commission_amount` on conversion) and related backend wiring still exist, but every user-facing string was scrubbed in V025 and across the frontend. The `cashbackRate` field on the store DTO is now used as a generic "deal label" string (admin form labels it that way). Don't add user-visible "cashback" copy until Phase 2.

### Cloudflare R2 dev configuration

Production reads R2 settings from env vars (`R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_PUBLIC_BASE_URL`) via `application.yml`. For dev, the Gradle-daemon env-var pipeline is unreliable, so the same values are also hardcoded into `application-dev.yml` under `couponvalley.media.*`. The dev profile (`SPRING_PROFILES_ACTIVE=dev`) overrides the env-var placeholders. **If you rotate credentials, update both places.**

Key gotchas:
- R2 endpoint must be the **account-level URL** only (`https://<account-id>.r2.cloudflarestorage.com`) — never include the bucket name. The SDK appends `/<bucket>/<key>` itself because we enable `pathStyleAccessEnabled(true)` in `MediaConfig`.
- R2 public URL is a **different host** (`https://pub-<hash>.r2.dev`), used by the browser to fetch uploaded files. Enable "Public R2.dev Bucket URL" in the Cloudflare dashboard or uploaded files will 403 on read.
- `MediaService.upload` logs `[MEDIA] R2 bucket=[…] publicBaseUrl=[…]` on startup — empty brackets means config didn't bind.

### Required env vars (dev profile provides defaults)

```
DB_URL / DB_USERNAME / DB_PASSWORD    # dev: localhost:5432/couponvalley_db / postgres / anshu
JWT_SECRET                            # dev: set in application-dev.yml
SPRING_PROFILES_ACTIVE                # default: dev
EMAIL_PROVIDER                        # dev: logging (prints to console); prod: resend
RESEND_API_KEY                        # prod only
PUBLIC_SITE_URL                       # default: http://localhost:3000
CORS_ALLOWED_ORIGINS                  # default: http://localhost:3000
R2_BUCKET / R2_ENDPOINT / R2_PUBLIC_BASE_URL / R2_ACCESS_KEY / R2_SECRET_KEY  # Cloudflare R2; dev also reads them from application-dev.yml
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET   # OAuth (Google sign-in)
```

---

## Cross-cutting notes

- **500 on `/api/v1/auth/register`?** The `handleUnexpected` handler in `GlobalExceptionHandler` logs the real cause — check the Spring Boot console, not the HTTP response body (intentionally opaque in production).
- **Image storage:** Backend uses Cloudflare R2 (S3-compatible) via AWS SDK. `next.config.mjs` has remote patterns for `r2.dev`, `r2.cloudflarestorage.com`, `cloudfront.net`, `logo.clearbit.com`, `images.unsplash.com`, `api.dicebear.com`, `upload.wikimedia.org`. Add new patterns there before using `next/image` against new hosts.
- **Email in dev:** `email.provider=logging` prints emails to the Spring Boot console. Verification tokens and password-reset links appear there.
- **Admin portal is fully built** — homepage CMS, banners CRUD with R2 upload, blog editor, legal pages, analytics dashboard, site settings, campaigns, drag-reorder for sections and banners, dev seed endpoints. No additional scaffolding needed.
- **Dev seed for the dashboard:** after the regular `POST /api/v1/dev/seed`, run `POST /api/v1/dev/seed-analytics` to populate ~3 k users + ~80 k clicks + ~3.5 k conversions distributed over 90 days. Idempotent — re-running wipes prior synthetic rows (identified by the `dev+*@couponvalley.local` email pattern) before re-inserting. Refreshes the analytics materialised views on completion so the dashboard reflects new data immediately.
- **Image render contract:** every store-logo / banner-image render site MUST use `overflow-hidden` on a fixed-dimension parent (`h-N w-N` or `aspect-X`) AND `object-contain` (or `object-cover`) on the `<img>` with explicit `h-full w-full` or `max-h-X max-w-X`. **Never use `max-w-full` alone** — that lets the natural image width win and the card grows. Admin uploaders (`NewStoreForm`, `NewBannerForm`) cap their preview at `max-w-[220px]` / `max-w-[560px]` for the same reason.
- **Homepage section preview links:** every public homepage section is wrapped in `<div id={s.code} className="scroll-mt-24">` so the admin homepage editor's "Preview" button can deep-link via `/#<section_code>`.
- **Drag-reorder components must be `dynamic({ ssr: false })`** — `@dnd-kit/sortable` generates non-deterministic accessibility IDs that trip React hydration. Use `HomepageSectionsEditorLazy.tsx` / `BannersReorderEditorLazy.tsx` as the pattern.
- Dev docs in `dev-docs/` contain product context but some claims (e.g. "no backend exists") are stale.
