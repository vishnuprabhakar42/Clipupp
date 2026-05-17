# CouponValley — Implementation Progress & Handoff

**Read this first when picking up work in a new session.** Together with `ARCHITECTURE.md` (in the same folder), this document gives you full context: what's already built, what decisions were made and why, where things live, what's next, and how to verify any of it locally.

If you're starting a new Claude Code session: skim §1, §2, §3.7 (current state), §4 (next sprint), and §5 (gotchas). Then dive into the sprint sections that touch your work.

---

## 1. Project at a glance

CouponValley is a Rakuten/RetailMeNot-style coupons + cashback platform. Polyglot mono-folder layout:

```
CouponValley/
├── frontend/couponvalley/    # Next.js 15 App Router (its own git repo)
├── backend/couponvalley/     # Spring Boot 4.0.6 / Java 21 (Gradle)
├── anshu-dev-doc/            # ARCHITECTURE.md, this file (PROGRESS.md)
├── docker-compose.yml        # Postgres + Adminer for collaborators
├── .env.example
├── .github/workflows/        # frontend-ci, backend-ci, openapi-sync (stub)
└── CLAUDE.md                 # Root operating notes
```

**Phase 1 target:** ~100k MAU, lean infra (single Postgres + single Spring Boot instance + Caffeine + Cloudflare CDN). No Kafka / ES / Redis cluster yet — explicit triggers documented in `ARCHITECTURE.md` §9.4.

**Phase progression:** Phase 1 (everything in this doc) → Phase 2 cashback wallet + payouts + community voting → Phase 3 browser extension + merchant portal + UGC.

---

## 2. Decisions locked in (treat these as load-bearing)

These are the choices that shape the codebase. Don't undo without explicit user direction.

| Decision | Choice | Where |
|---|---|---|
| Auth | Email+password (BCrypt + email verify + reset) AND Google OAuth (backend-mediated). Backend issues JWT. | Sprint 1 |
| Frontend auth removal | NextAuth, `@auth/prisma-adapter`, `prisma/`, frontend Prisma all deleted | Sprint 0 |
| Affiliate handling | Direct network integrations (Impact + CJ live, Awin/Rakuten/Admitad stub) with HMAC-verified postbacks | Sprint 4 |
| Merchant model | Admin-curated at launch; merchant self-serve in Phase 3 | (deferred) |
| Cashback wallet | Schema reserved (Conversion state machine ready); wallet credit logic in Phase 2 | (deferred) |
| Browser extension | API surface designed in `ARCHITECTURE.md`; no code yet | (Phase 3) |
| Community voting | Phase 2 | (deferred) |
| i18n | Phase 1 = EN (default, no prefix) + HI (under `/hi/`). next-intl with `localePrefix: as-needed` | Sprint 3 |
| Currency | INR primary, USD secondary, FX table seeded but unused until Phase 2 | Sprint 2 |
| SEO | First-class — SSR + ISR, JSON-LD per page type, hreflang alternates, OG image generators, sitemap from backend | Sprint 3 |
| Test infra | JUnit + AssertJ unit tests on critical-path logic. Spring Boot `@SpringBootTest` + Testcontainers integration tests deferred until CI has Docker | Sprint 1+ |
| Local Postgres | User runs Postgres directly on host (not docker-compose). DB `couponvalley_db`, user `postgres`, password `anshu`. `application-dev.yml` is configured to match — **do not change**. | Sprint 0 |
| Email adapter | `LoggingEmailAdapter` (logs payload to console) is the Phase 1 default. Resend/SES adapter swaps in via `couponvalley.email.provider` config when API key is wired. | Sprint 1 |

The user prefers **lean Phase 1 infra** — defer Kafka/ES/Redis-cluster/ClickHouse until concrete scale triggers fire (documented in `ARCHITECTURE.md` §9.4). When in doubt, use the simpler path and flag the trigger to upgrade.

---

## 3. What's been built (Sprint by Sprint)

Every sprint is closed: backend tests pass, frontend `lint + typecheck + build` all green.

### Sprint 0 — Cleanup & Foundations ✓

**Frontend cleanup:** deleted `auth.ts`, `auth.config.ts`, `app/api/auth/`, `components/auth/`, `prisma/`, `schemas/`, `lib/axios.ts`, `lib/prisma.ts`, `lib/api/store.ts`, `hooks/use-stores.tsx`, `utils/getCookies.ts`, `app/dashboard/`, `components/dashboard/`. Dropped deps: `next-auth`, `@auth/prisma-adapter`, `@prisma/client`, `prisma`, `axios`. Added: `next-intl`, `zustand`, `openapi-typescript` (dev), `eslint`, `eslint-config-next@15.2.4` (matched to Next 15.2.4).

**Frontend configs:** `next.config.mjs` re-enables TS/ESLint enforcement (was both ignored), removes `unoptimized: true`, adds `remotePatterns`. `tsconfig.json` drops the dead `../server/...` include. `app/layout.tsx` removes `generator: "v0.dev"`. Added `.eslintrc.json` with Next core-web-vitals + `no-unescaped-entities` off.

**Backend foundations:**
- Package moved `com.example.couponvalley` → `com.couponvalley`
- `application.properties` → profiled YAML (`application.yml` + `application-dev.yml` + `application-prod.yml`). `SecurityAutoConfiguration` exclusion removed. `ddl-auto=validate` (not `update`). Server compression on. Virtual threads on.
- `build.gradle`: group → `com.couponvalley`. Added Flyway, JJWT, Caffeine, Bucket4j, AWS S3 (R2), Mail, Testcontainers.
- `CouponvalleyApplication`: `@EnableJpaAuditing(auditorAwareRef = "auditAware")`, `@EnableScheduling`, `@EnableAsync`, `@EnableCaching`
- Module skeleton scaffolded (vertical slices: `api / application / domain / infra` per module)
- **Common platform code:** `SecurityConfig` (default-deny + public allowlist + Bearer + CORS), `GlobalExceptionHandler` (RFC 7807 problem+json with `code` + `traceId`), `RequestIdFilter` (MDC + `X-Request-Id` header), `AuditAware` (Spring Data auditing source from JWT principal), `CacheConfig` (Caffeine cache manager with named caches), `OpenApiConfig` (springdoc with bearer + refresh-cookie security schemes), `PingController` (smoke endpoint at `/api/v1/ping`).
- `V001__init_pgcrypto_citext.sql`: `pgcrypto`, `citext`, `pg_trgm` extensions + `platform_meta` marker

**Repo root:** `docker-compose.yml` (Postgres + Adminer), `.env.example`, `.github/workflows/{frontend,backend,openapi-sync}-ci.yml`.

### Sprint 1 — Auth + Users ✓

**V002 migration:** `app_user`, `user_role`, `user_preference`, `oauth_account`, `refresh_token` (rotation chain + replay detection), `email_verification_token`, `password_reset_token`, `audit_log`, `outbox`.

**Backend domain:** `AppUser`, `UserPreference`, `OAuthAccount`, `RefreshToken`, `EmailVerificationToken`, `PasswordResetToken`, `Role` enum, `UserStatus` enum, `AuditLog`, `OutboxEntry`, `AuditableEntity` (`@MappedSuperclass`).

**Backend services & infra:**
- `JwtIssuer` (HS256, 32-byte minimum, audience + issuer enforcement), `JwtAuthenticationFilter` wired into SecurityConfig before `UsernamePasswordAuthenticationFilter`
- `SecureTokens` (256-bit tokens, SHA-256 hash for DB storage)
- `PasswordPolicy` (≥12 chars, char-class mix, denylist, no-email-substring)
- `TokenService` — refresh rotation with replay-detection (presenting a `used_at` token revokes the entire chain)
- `AuthService` — register, login (with 5/15min lockout), refresh, logout, verify-email, resend-verification, forgot-password, reset-password, change-password
- `UserService` — me + profile + preferences
- `OutboxService` + `OutboxPoller` (`@Scheduled(fixedDelay=5000)`, exponential backoff, capped at 30min)
- `EmailAdapter` port + `LoggingEmailAdapter` (Phase 1 default — logs payload) + `EmailDispatcher` (outbox topic `email.send`)
- `AuditLogService` — append-only, swallows errors so business txns don't fail on audit hiccups
- `RefreshCookie` helper (`HttpOnly + Secure + SameSite=Strict`, dev-relaxed via `couponvalley.cookie.secure: false`)

**Backend API:** `AuthController` (8 endpoints under `/api/v1/auth`), `UsersController` (5 endpoints under `/api/v1/users/me`).

**Frontend:** `lib/api/{client,types,errors,auth,users}.ts`, `lib/auth/{token-store,server,AuthProvider}.tsx`, auth pages (sign-in, sign-up, forgot-password, reset-password, verify-email), `(authed)/account/{layout,page,profile,preferences}/page.tsx`. Root layout wraps `<AuthProvider initialUser={session}>` + `<Toaster/>`.

**Tests:** 16 unit tests passing — `SecureTokens` (3), `PasswordPolicy` (8), `JwtIssuer` (5).

### Sprint 2 — Stores + Coupons + Categories + Search ✓

**V003 / V004 / V005 migrations:** region/currency seeds (IN/US/GB/AE/DE/FR/SG with INR/USD/GBP/EUR/AED/SGD), full store catalog, categories + coupons with FTS triggers (tsvector + GIN + pg_trgm).

**Backend domain:** `Store`, `Stats`, `ContentWriter`, `Faq`, `FeaturedArticle`, `StoreTopOffer` (composite-key embedded), `Category` (self-FK parent), `Coupon` (with `@ManyToMany Category`), `CouponType` / `CouponStatus` / `StoreStatus` enums, `Region` / `Currency` reference entities.

**Backend services:** `StoreService` (slug detail with FAQs/articles/top-offers/stats, listActive, listByCategory, similar, full admin CRUD with soft-delete + restore + stats refresh), `CouponService` (slug detail, list with type+category+activeOnly filters, homepageTop, full admin CRUD, category resolution), `CategoryService` (cached tree via `@Cacheable("category.tree")`, admin CRUD), `SearchService` + `SearchRepository` (Postgres FTS with `plainto_tsquery + ts_rank`, fuzzy fallback via `pg_trgm.similarity`, separate paths for stores/coupons/categories).

**Backend common:** `Slugifier` (NFD normalization, `&`→"and", 80-char cap, `compose(prefix, title)`), `CursorEncoder` (sealed `OffsetCursor`/`KeyCursor` with type-prefixed base64url), `CursorPage<T>` envelope.

**Backend API:** `PublicStoresController`, `PublicCouponsController`, `PublicOffersController` (filtered to non-code types), `PublicCategoriesController`, `SearchController`, `AdminStoresController`, `AdminCouponsController`, `AdminCategoriesController`. Cache-Control headers per endpoint.

**Frontend:** `lib/api/{stores,coupons,categories,search}.ts`. Pages rebuilt against backend: `/stores`, `/stores/[slug]` (ISR=60), `/coupons`, `/coupons/[slug]` (with `<CouponReveal>` client island), `/offers`, `/offers/[slug]`, `/categories`, `/categories/[slug]`, `/search` (`noindex,follow`). Components: `CouponList`, `CouponSavingsCard`, `CouponReveal`, `HeaderSearch` (built but **not yet wired into header.tsx** — Sprint 7 polish).

**Tests:** 32 total — adds 8 Slugifier + 8 CursorEncoder.

### Sprint 3 — SEO + i18n ✓

**Route restructure:** every page moved under `app/[locale]/...`. Root `app/layout.tsx` is a passthrough; the real layout (`app/[locale]/layout.tsx`) sets `<html lang dir>`, calls `setRequestLocale`, wraps in `NextIntlClientProvider` + Theme + LegacyLanguage shim + ReactQuery + Auth + Toaster, and renders `OrganizationSchema` + `WebSiteSchema` JSON-LD sitewide.

**next-intl scaffolding:** `lib/i18n/{config,routing,navigation,request}.ts`. `localePrefix: "as-needed"`. `messages/{en,hi}.json` with namespaced keys + `legacy` namespace to keep existing marketing components working unchanged via `useLanguage()` shim (now backed by next-intl).

**Backend SEO:** `SitemapController` serves `/sitemap.xml`, `/sitemaps/{stores,coupons,categories}.xml`, `/robots.txt`. `SitemapService` generates XML inline from Postgres projections, emits `xhtml:link` hreflang alternates per URL, chunked at 50k. Phase 1 lean — no R2 upload, no @Scheduled job (trigger to add: when sitemap exceeds a single 50k chunk).

**Frontend SEO:**
- `components/seo/`: `JsonLd` (XSS-escaped renderer), `OrganizationSchema`, `WebSiteSchema` (with `SearchAction`), `BreadcrumbSchema`, `StoreSchema` (Store + AggregateRating + PostalAddress), `OfferSchema` (validFrom/validThrough/availability/category/offeredBy/priceSpecification), `FAQPageSchema`, `CollectionPageSchema`. Wired into store-detail, coupon-detail, category-detail pages.
- OG image generators (edge runtime): `app/og/store/[slug]/route.tsx`, `app/og/coupon/[slug]/route.tsx` using `next/og` `ImageResponse`
- `app/sitemap.ts` delegates to backend `/sitemap.xml`. `app/robots.ts` emits Next-managed robots
- `lib/seo/urls.ts`: `siteUrl()`, `canonicalFor(path, locale)`, `hreflangAlternates(path)` returning `{ en, hi, "x-default" }`
- Hreflang in `generateMetadata` on store/coupon/category detail pages

### Sprint 4 — Clickout + Affiliates + Conversions ✓

**V006 / V007 migrations:** `affiliate_network`, `merchant_network_link` (priority + active partial index for hot lookup), `click` (UUIDv7 click_id, BRIN by created_at), `conversion` (state machine with `(network_id, network_txn_id)` UNIQUE for idempotency).

**Backend:**
- Domain: `AffiliateNetwork`, `MerchantNetworkLink`, `Click` (`ClickSource` enum), `Conversion` (`ConversionState` enum: PENDING/APPROVED/REJECTED/REVERSED)
- `LinkTemplateEngine`: safe URL templating with `{merchantUrl}`, `{sub_id}`/`{click_id}`, `{advertiser_id}`, `{network_code}`. Unknown placeholders preserved verbatim. URL-encoded substitutions.
- `HmacVerifier`: shared HMAC-SHA256 utility — constant-time compare, optional ±5min timestamp window, accepts seconds or millis
- `NetworkAdapter` port: `code()`, `verifyPostback()`, `parsePostback()` returning normalized `Postback` record
- Adapters in `affiliates/infra/`: **`ImpactAdapter`** (production-ready — Action Tracker S2S spec; `X-Impact-Signature`/`X-Impact-Timestamp`), **`CjAdapter`** (production-ready — CJ commission spec), `AwinAdapter` / `RakutenAdapter` / `AdmitadAdapter` (`StubAdapter` subclasses ready to flip on)
- `NetworkAdapterRegistry` auto-discovers by `code()`
- `ClickRedirectCache`: Caffeine-backed denormalized lookup (coupon → store → active link → template). Admin write paths evict via existing `coupon.redirect` cache.
- `ClickService.recordClick`: synchronous insert (sub-5ms target), async popularity counter. Falls back to direct merchant URL when no active affiliate link.
- `PostbackService.ingest`: verifies signature → parses → idempotent on `(network_id, network_txn_id)`. Duplicates re-applied as state transitions.
- `NetworkSecretResolver`: reads from `affiliate_network.postback_secret_enc`; env override `COUPONVALLEY_NETWORK_SECRET_<CODE>` for sandbox

**Backend API:** `RedirectController` (`GET /r/{couponId}` — 302 with `X-CV-Click-Id`), `PostbackController` (`POST /postback/{network}` — raw-body HMAC, 202 on new / 200 on dup), `AdminAffiliateNetworkController`, `AdminMerchantNetworkLinkController`, `AccountClicksController` (`GET /api/v1/account/clicks`).

**Frontend:** `lib/api/account.ts` (`accountApi.clicks`). `(authed)/account/click-history` page (cookie-bridge SSR'd, paginated). `CouponReveal` already wired to `${API_BASE}/r/${couponId}`.

**Tests:** 47 total — adds 5 LinkTemplateEngine + 10 HmacVerifier.

### Sprint 5 — Newsletter + Saved Coupons + Notifications ✓

**V008 migration:** `saved_coupon` (composite PK), `newsletter_subscription` (citext-unique email, status enum, separate confirm/unsubscribe token hashes), `notification_preference` (per-channel email opt-ins), `notification` (in-app inbox).

**Backend:**
- Domain: `SavedCoupon`, `NewsletterSubscription` (state machine: `confirm() / unsubscribe() / rotateConfirmation() / linkUser()`), `NewsletterStatus`, `NewsletterSource`, `NotificationPreference`, `Notification`
- `NewsletterService` — double opt-in via outbox/email. `subscribe` is enumeration-safe, idempotent for already-CONFIRMED, resends confirm for PENDING, reactivates UNSUBSCRIBED. `confirm` single-use. `unsubscribe` idempotent. Audit logged.
- `SavedCouponService` — save (idempotent on DUP-PK), unsave (best-effort), list with eager-fetched coupon details

**Backend API:** `PublicNewsletterController` (`POST /newsletter/subscribe`, `GET /newsletter/{confirm,unsubscribe}` — already permitted in SecurityConfig from Sprint 0), `AccountSavedCouponsController`, `AdminNewsletterController` (paginated + CSV export with proper escaping).

**Frontend:** `lib/api/{newsletter,savedCoupons}.ts`. Footer rewired with `<NewsletterForm/>` (was `console.log`). `/newsletter/{confirm,unsubscribe}` server-rendered pages. `<SaveCouponButton/>` (optimistic UI, login-wall to `/sign-in?next=...`, `iconOnly` mode for cards). Wired into `CouponSavingsCard` + coupon-detail page. `(authed)/account/saved-coupons` page.

**Tests:** 52 total — adds 5 `NewsletterSubscription` domain tests.

### Sprint 6 — Admin Panel ✓

**V009 migration:** `author`, `article` (status enum DRAFT/SCHEDULED/PUBLISHED/HIDDEN with state-machine helpers), `banner` (homepage carousel, country-targeted, time-windowed).

**Backend:**
- Domain: `Author`, `Article`, `ArticleStatus`, `Banner`
- `BlogService` — author + article CRUD, `transition()` (PUBLISH / SCHEDULE / HIDE / DELETE) with audit
- `BannerService` — CRUD with `@CacheEvict("homepage.top")` on writes; `live(country)` filters by time-window
- `AdminUsersController` — paginated user list, `POST/DELETE /users/{id}/roles/{role}`, `PATCH /users/{id}/status`. Audit logged.
- `AdminClicksController` + `AdminConversionsController` — read-only paginated streams, newest first

**Backend API additions:** `PublicBlogController`, `PublicBannersController`, `AdminBlogController` (articles + authors + transition), `AdminBannersController`, `AdminUsersController`, `AdminClicksController`, `AdminConversionsController`. SecurityConfig allowlist updated to permit `GET /api/v1/banners/**`.

**Frontend:**
- `lib/api/admin.ts` — typed clients for every admin endpoint (stores, coupons, categories, networks, merchant-links, newsletter, users, clicks, conversions, articles, authors, banners). `SpringPage<T>` for offset-paginated admin endpoints.
- `lib/admin/server-fetch.ts` — server-side cookie-bridge helper (refresh `cv_rt` → access token → admin endpoint)
- **`(admin)/admin/layout.tsx`** — sticky sidebar (grouped: Catalog / Content / Affiliates / People), role gate (anon → `/sign-in`, non-ADMIN → 403 panel), email + sign-out
- 19 admin pages built: `Dashboard`, `Stores` (+ new), `Coupons` (+ new), `Categories` (+ new), `Banners` (+ new), `Blog` (read-only), `Networks` (+ new), `Merchant Links` (+ new), `Users`, `Newsletter`, `Clicks`, `Conversions`
- Per-row admin client islands: `<UserRoleControls>` (inline +/− toggle for each role), `<NewStoreForm>`, `<NewCouponForm>`, `<NewCategoryForm>`, `<NewNetworkForm>`, `<NewMerchantLinkForm>`, `<NewBannerForm>`

### 3.7 Current state snapshot (where things stand right now)

- **Backend tests:** 52 passing, 0 failing. `./gradlew build` clean.
- **Frontend build:** clean lint, clean typecheck, `npm run build` produces ~39 routes per locale × 2 locales (EN + HI), plus `/sitemap.xml`, `/robots.txt`, OG generators. Two warnings on `<img>` in OG route handlers — intentional, `next/og` `ImageResponse` doesn't run `next/image`.
- **Migrations applied through V009:** V001 (extensions), V002 (auth), V003 (region/currency), V004 (store catalog), V005 (category + coupon + FTS), V006 (affiliates), V007 (clicks + conversions), V008 (saved + newsletter + notifications), V009 (blog + banner).
- **First admin user must be promoted manually** (Sprint 7 hardening item):
  ```sql
  INSERT INTO user_role(user_id, role)
    VALUES ('<your-user-uuid>', 'ADMIN');
  ```

---

## 4. What's next — Sprint 7 (Hardening + Launch)

Per `ARCHITECTURE.md` §12, Sprint 7 is the launch-prep sprint. Tasks (from spec):

- **Apply rate-limit filter (Bucket4j)** on the documented buckets — per-IP unauth, per-user auth, per-IP login/register/password-reset
- **Apply idempotency interceptor** on all mutating endpoints (`Idempotency-Key` header, in-memory + DB-backed dedup)
- **CSP tightening** (start `report-only`, then enforce); no inline scripts on `/admin`
- **Dependency scan** (OWASP Dependency-Check + Renovate); pin Next.js to a CVE-patched version (Sprint 0 noted CVE-2025-66478 on Next 15.2.4 — bumping is part of this work)
- **Pen-test checklist** — OWASP Top 10 walkthrough on staging
- **Load tests (k6):** clickout 200 rps, search 100 rps, public list 200 rps; assert latency budget
- **Observability:** Sentry DSN, Actuator metrics scraped, basic Grafana Cloud dashboard (error rate, p95 latency, DB connections, JVM heap, sitemap-regen success, outbox lag); alerts (5xx > 1% for 5min, p95 over budget for 15min, outbox lag > 60s, sitemap last-success > 25h)
- **Runbooks** in `anshu-dev-doc/runbooks/`: deploy, rollback, rotate-secret, restore-from-backup, force-purge-CDN, on-call-cheatsheet
- **First-admin bootstrap** — config + first-run hook so promoting the first ADMIN doesn't require raw SQL (small but high-value)
- **DNS, TLS, prod env, blue/green deploy**, soft-launch QA, public launch

### Beyond Sprint 7 (Phase 2 onward)

- **Phase 2 (~6–8 weeks):** wallet ledger goes live (Conversion APPROVED → WalletEntry credit), withdrawals (PayPal + Razorpay UPI), KYC, voting + did-it-work signals, push (FCM), weekly digest cron, ES + FR + AR locales, multi-currency wallets, infra upgrades when triggers fire (2nd backend instance + Redis, possibly read replica, possibly Kafka)
- **Phase 3 (~8–12 weeks):** browser extension (Chrome + Firefox + Edge), merchant self-serve portal, user-submitted coupons + moderation, paid placements + billing, advanced search (autocomplete + synonyms), affiliate network #5 (Admitad)
- **Phase 4 (ongoing):** ML recs, fraud model, mobile apps, warehouse + dbt, A/B testing

---

## 5. Gotchas, conventions, and "why this is here"

Things that aren't obvious from reading the code but trip up newcomers:

- **`couponvalley_db` / `postgres` / `anshu`** — the user's local Postgres. `application-dev.yml` is configured for it. Don't switch to docker-compose's `couponvalley` defaults.
- **No Spring Boot integration tests yet.** `@SpringBootTest` requires Postgres + Testcontainers + Docker, none of which are in the user's local CI. We have rich unit-test coverage (52 tests on critical-path logic). Adding Testcontainers tests is a Sprint 7+ task.
- **Custom `LanguageProvider` is a shim**, not a real provider. `components/language-provider.tsx` exports a no-op `LanguageProvider` and a `useLanguage()` hook backed by next-intl's `legacy` namespace. ~10 marketing components still call `useLanguage()` — that's intentional. Eventual full migration is fine but not required.
- **Homepage marketing components still use `data/coupons.ts` + `data/categoriesData.ts`.** Sprint 5+ never rewired them to backend. Top-coupons, brand-section, popular-offers, banner-slider, top-shops, trending-categories are all static. Wiring them to `couponsApi.top()`, `storesApi.list({ sort: 'popular' })`, etc. is a follow-up.
- **`HeaderSearch` component is built but not wired into `header.tsx`.** The component is in `features/catalog/components/HeaderSearch.tsx`, ready to swap into the header's existing search form. Sprint 2 follow-up.
- **First-admin promotion is manual SQL.** No bootstrap config yet. Sprint 7.
- **Email is logged, not sent.** `LoggingEmailAdapter` writes the rendered model to console. Verify/reset URLs live in the dev console output. Wire Resend by setting `couponvalley.email.provider=resend` + `RESEND_API_KEY`.
- **`<img>` lint warnings in OG routes are expected.** `next/og` `ImageResponse` runs in edge runtime and uses standard `<img>` tags by design.
- **`next/image` is `unoptimized` on most catalog images** (`unoptimized` prop set explicitly). Phase 2 integration with Cloudflare Image Resizing or `next/image` loader is when that comes off.
- **Affiliate adapter codes must match registered `NetworkAdapter` beans** — `AffiliateAdminService.createNetwork` rejects unknown codes. To add `klook`/`booking`/etc.: write a new `@Component` adapter under `affiliates/infra/` first.
- **Postback secrets:** environment override `COUPONVALLEY_NETWORK_SECRET_<CODE>` (uppercase) takes precedence over the DB column when `couponvalley.affiliates.env-secret-override=true` (default). Use this for dev/sandbox without writing the secret to Postgres.
- **Refresh tokens are opaque + DB-stored**, not JWT. Plain values live only in the `cv_rt` HttpOnly cookie. We hash on storage. Replay (presenting a `used_at` token) revokes the entire chain.
- **All money columns are `NUMERIC(19,4)`** with a `*_currency CHAR(3)` neighbor. Never `DOUBLE`/`REAL`.
- **Slugs are 80 chars max**, ASCII-only, hyphenated, lowercase. `Slugifier.slugify(input)` is the only way slugs get generated. Diacritics stripped via NFD; non-Latin scripts dropped (admin must provide explicit transliterated slug).
- **`audit_log` is append-only.** Every admin write across every sprint logs an entry. The backend `AuditLogService` swallows audit errors so business txns don't fail when audit hiccups.
- **Cache invalidation:** admin write paths emit `@CacheEvict` on the relevant Caffeine cache (`store.detail`, `coupon.detail`, `category.tree`, `coupon.redirect`, `homepage.top`). Cloudflare Cache-Tag purge is wired through cache headers but not yet pushed via API call (Sprint 7).

---

## 6. Where things live (file map)

**Backend (`backend/couponvalley/`)**

```
src/main/java/com/couponvalley/
├── CouponvalleyApplication.java
├── common/
│   ├── audit/        # AuditableEntity, AuditAware, AuditLog/Service/Repository
│   ├── config/       # SecurityConfig, JwtProperties, CacheConfig, OpenApiConfig
│   ├── error/        # GlobalExceptionHandler, ApiException, ErrorCode, FieldErrorDto
│   ├── outbox/       # OutboxEntry, OutboxService, OutboxDispatcher, OutboxPoller
│   ├── pagination/   # CursorPage, CursorEncoder
│   ├── reference/    # Region, Currency, repos
│   ├── text/         # Slugifier
│   └── tracing/      # RequestIdFilter
├── auth/
│   ├── api/          # AuthController, RefreshCookie, dto/
│   ├── application/  # AuthService, TokenService, SecureTokens, PasswordPolicy
│   ├── domain/       # Role, UserStatus, OAuthAccount, RefreshToken, EmailVerificationToken, PasswordResetToken
│   └── infra/        # JwtIssuer, JwtAuthenticationFilter, repos
├── users/
├── stores/
├── coupons/
├── categories/
├── search/
├── affiliates/       # Network adapter port, registry, ImpactAdapter, CjAdapter, stubs, AffiliateAdminService
├── clicktrack/       # Click, ClickRedirectCache, ClickService, RedirectController, AccountClicksController
├── conversions/      # PostbackService, NetworkSecretResolver, PostbackController
├── savedcoupons/
├── newsletter/
├── notifications/    # EmailAdapter, LoggingEmailAdapter, EmailDispatcher, NotificationPreference, Notification
├── blog/             # Article, Author, BlogService, PublicBlogController
├── banner/           # Banner, BannerService, PublicBannersController
├── media/            # (skeleton — R2 presign endpoint deferred)
├── admin/api/        # AdminStoresController, AdminCouponsController, AdminCategoriesController,
│                     # AdminAffiliateNetworkController, AdminMerchantNetworkLinkController,
│                     # AdminBlogController, AdminBannersController, AdminUsersController,
│                     # AdminClicksController, AdminConversionsController, AdminNewsletterController
└── seo/              # SitemapController, SitemapService

src/main/resources/db/migration/
├── V001__init_pgcrypto_citext.sql
├── V002__core_users_auth.sql
├── V003__seed_region_currency.sql
├── V004__store_catalog.sql
├── V005__category_coupon.sql
├── V006__affiliates.sql
├── V007__clicks_conversions.sql
├── V008__saved_newsletter_notifications.sql
└── V009__blog_banner.sql
```

**Frontend (`frontend/couponvalley/`)**

```
app/
├── layout.tsx                       # Passthrough — see [locale]/layout.tsx
├── globals.css
├── [locale]/
│   ├── layout.tsx                   # html/body, providers, JSON-LD sitewide
│   ├── (public)/
│   │   ├── layout.tsx               # Header + main + Footer
│   │   ├── page.tsx                 # Homepage
│   │   ├── stores/{page,[slug]/page}.tsx
│   │   ├── coupons/{page,[slug]/page}.tsx
│   │   ├── offers/{page,[slug]/page}.tsx
│   │   ├── categories/{page,[slug]/page}.tsx
│   │   ├── blog/page.tsx            # Placeholder — backend has CRUD but no rendering page yet
│   │   ├── search/page.tsx
│   │   └── newsletter/{confirm,unsubscribe}/page.tsx
│   ├── (auth)/{sign-in,sign-up,forgot-password,reset-password,verify-email}/page.tsx
│   ├── (authed)/account/{layout,page,profile,preferences,saved-coupons,click-history}/page.tsx
│   └── (admin)/admin/                # Sprint 6 — see §3.6 admin pages
├── og/{store,coupon}/[slug]/route.tsx
├── sitemap.ts
└── robots.ts

middleware.ts                        # next-intl locale routing
features/
├── auth/                            # Sprint 1 forms (SignInForm, SignUpForm, ForgotPasswordForm, ...)
├── catalog/                         # CouponList, CouponSavingsCard, CouponReveal, HeaderSearch
├── savedcoupons/                    # SaveCouponButton
├── newsletter/                      # NewsletterForm
└── admin/                           # AdminPageHeader, NewStoreForm, NewCouponForm, ...

lib/
├── api/                             # client.ts, errors.ts, types.ts + per-domain modules
│   ├── auth.ts, users.ts
│   ├── stores.ts, coupons.ts, categories.ts, search.ts
│   ├── account.ts (clicks)
│   ├── newsletter.ts, savedCoupons.ts
│   └── admin.ts                     # All admin endpoints
├── auth/{token-store,server,AuthProvider}.tsx
├── i18n/{config,routing,navigation,request}.ts
├── seo/urls.ts
└── admin/server-fetch.ts            # Cookie-bridge for SSR'd admin pages

components/
├── ui/                              # shadcn primitives (kept as-is)
├── seo/                             # JSON-LD components
├── language-provider.tsx            # next-intl shim
├── language-toggle.tsx              # EN/HI switcher
├── header.tsx, footer.tsx           # legacy components — still use useLanguage shim
├── banner-slider.tsx, brand-section.tsx, top-coupons.tsx, ...   # static-data marketing
└── theme-provider.tsx, theme-toggle.tsx

messages/
├── en.json
└── hi.json
```

---

## 7. How to verify locally

```bash
# Backend
cd backend/couponvalley
./gradlew build            # compile + tests + jar — should be green
./gradlew bootRun --args='--spring.profiles.active=dev'
# Flyway applies V001–V009 to couponvalley_db on first boot.
# Swagger: http://localhost:8080/swagger-ui.html
# Sitemap: curl http://localhost:8080/sitemap.xml
```

```bash
# Frontend
cd frontend/couponvalley
npm install
npm run lint && npm run typecheck && npm run build   # all green
npm run dev                                          # http://localhost:3000
```

**Walkthrough to exercise the full Phase 1 stack:**

1. Backend running. Sign up at `http://localhost:3000/sign-up`. Check the backend console for the `EMAIL [verify-email]` log line — paste the verify URL into your browser.
2. Sign in. Visit `/account` — see your session.
3. Promote yourself to ADMIN: `psql couponvalley_db -c "INSERT INTO user_role(user_id, role) VALUES ('<uuid>', 'ADMIN');"`. Refresh the page.
4. Visit `/admin` — admin dashboard.
5. Create a category, store, and coupon via the admin forms.
6. Create an affiliate network (e.g. `impact`), then a merchant network link with a deeplink template.
7. Visit the public store page, click a coupon's reveal button. The browser hits `/r/{couponId}`, gets a 302, lands on the (templated) merchant URL. Backend logs `X-CV-Click-Id`.
8. Visit `/admin/clicks` — see the row.
9. Subscribe an email via the footer. Find the `EMAIL [newsletter-confirm]` line, click the confirm URL → "You're subscribed".
10. Save a coupon (bookmark icon) → visit `/account/saved-coupons` → see it.

---

## 8. Useful context / memory

There are project memories at `/Users/anshu/.claude/projects/-Users-anshu-Desktop-CouponValley/memory/`:
- `MEMORY.md` — index
- `project_couponvalley.md` — vision + scope + decisions
- `project_postgres_dev.md` — local Postgres setup (couponvalley_db / postgres / anshu)
- `feedback_lean_phase1_infra.md` — the user's strong preference for lean infra in early phases

These auto-load into context when relevant. Update them when decisions change.

---

## 9. The contract for resuming

**On a fresh Claude Code session:**

1. Read `anshu-dev-doc/ARCHITECTURE.md` (system design, decisions, triggers).
2. Read this file (`PROGRESS.md`) — what's actually built.
3. Skim `CLAUDE.md` at repo root (operating notes for Claude).
4. Run `./gradlew build` and `npm run build` to confirm both sides are still green.
5. If implementing a new sprint, follow the sprint pattern that's already worked: migrations → entities → repos → services → API → tests → frontend lib/api → pages → smoke. Update `MEMORY.md` if you learn anything load-bearing for future sessions.
6. Sprint 7 is next. Hardening + launch. Per §4 above.

If anything in this document drifts from reality, update it inline rather than letting two sources of truth exist.
