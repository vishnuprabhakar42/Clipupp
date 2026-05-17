# CouponValley — Architecture Document

**Document Version:** 1.0
**Date:** 2026-05-09
**Status:** Phase 1 design — approved for build
**Audience:** Engineering, design, product

---

## How to read this document

Read top-to-bottom on first pass. It's organized so each section answers its own question without requiring the next:

1. **Project Overview** — what we're building and for whom
2. **System Architecture** — the stack, the diagram, the why
3. **Frontend Architecture** — how the Next.js app is organized
4. **Backend Architecture** — how the Spring Boot app is organized
5. **Database Design** — every Phase 1 table, column, and index
6. **API Design Strategy** — REST conventions used everywhere
7. **Security Architecture** — auth, JWT, roles, hardening
8. **Caching Strategy** — what we cache, where, for how long, when to invalidate
9. **Performance & Scalability** — the perf budget and the triggers to scale out
10. **Feature Roadmap** — Phase 1 → Phase 4
11. **Technical SEO & Performance** — first-class SEO design (a Phase 1 priority)
12. **Development Task Breakdown** — the ordered Phase 1 sprint plan

This doc supersedes `frontend/couponvalley/dev-docs/02-technical-analysis.md` and `03-gaps-and-roadmap.md` for forward-looking decisions; those documents remain as a record of what existed before this redesign.

---

## 1. Project Overview

### 1.1 Vision

CouponValley is a savings ecosystem: discount codes, cashback, deals, and merchant promotions across thousands of online and in-store retailers, organized into a fast, multilingual, SEO-strong website. Over time it grows into a browser extension, merchant self-serve portal, community-driven coupon submissions, and personalized recommendations.

### 1.2 Phase 1 goal (this document)

Ship a complete, production-grade website that:
- Is **usable end-to-end** for a real visitor — sign up, browse, search, save, click through to merchants
- Is **fast** (Core Web Vitals "good" on mobile and desktop)
- Is **technical-SEO friendly** (SSR, structured data, canonical, hreflang, sitemap, OG, perfect URLs)
- Is **interactive and polished** (smooth UX, optimistic UI, proper feedback)
- Comfortably handles **~100k MAU / ~3M pageviews / month / ~50 rps peak** on **lean, cheap infrastructure** (under $50/mo at MVP traffic)
- Sets up a clean foundation for Phase 2 (cashback wallet) and Phase 3 (extension, merchant portal, UGC)

We deliberately do NOT introduce Kafka, Elasticsearch, ClickHouse, or a Redis cluster in Phase 1. Each is justified in §2.4 with concrete triggers for when to add them.

### 1.3 Personas

1. **Bargain Hunter (Priya, 24, Mumbai)** — searches "Amazon coupon", lands on store page, copies code, leaves. Mobile-first. Doesn't sign up.
2. **Loyal Saver (Marcus, 34, Texas)** — signs up, saves coupons, subscribes to weekly digest, returns repeatedly. Desktop + mobile.
3. **Deal Researcher (Ayan, 29, Bangalore)** — compares stores, reads blog, verifies codes against community signals (Phase 2). Mobile.
4. **Merchant (Phase 3)** — onboards their store, uploads coupons, watches performance dashboard, optionally pays for placement.
5. **Admin (internal)** — moderates content, manages stores/coupons/banners/blog, monitors clicks/conversions, reviews fraud.

### 1.4 Revenue model

- **Affiliate commission** on outbound clicks that convert (primary)
- **Paid placements** — featured slots on homepage, category pages, search results (Phase 3)
- **Newsletter sponsorships** (Phase 2)
- **Phase 2:** keep a margin between commission earned and cashback paid out to users

### 1.5 Target scale (3-year)

| Metric | Phase 1 (MVP) | Phase 2 | Phase 3 |
|---|---|---|---|
| MAU | 100k | 1M | 10M |
| Pageviews/mo | 3M | 30M | 250M |
| Outbound clicks/mo | 100k | 1M | 5M |
| Cashback transactions/mo | 0 (off) | 100k | 500k |
| Coupons in DB | 50k | 200k | 1M |
| Stores in DB | 1k | 5k | 20k |
| Read RPS peak | 50 | 500 | 5000 |
| Backend instances | 1 | 2–4 | 10+ |

### 1.6 Non-goals for Phase 1

- Cashback payouts (schema exists, feature off)
- Browser extension (designed, not built)
- Merchant self-serve (admin-curated only)
- User-submitted coupons (admin-curated only)
- Push notifications (email only)
- Multi-currency wallet (FX table seeded but unused)
- ES/HI/FR/AR locales beyond EN+HI

---

## 2. System Architecture

### 2.1 High-level diagram — Phase 1 (lean)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (browser / mobile)                        │
│   Next.js 15 App Router (RSC + ISR + client islands)                     │
│   shadcn/ui + Tailwind + next-intl + React Query + Zustand               │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                       Cloudflare CDN
                  (HTML, assets, public JSON)
                  Cache-Tag invalidation, Brotli
                               │
                ┌──────────────┴──────────────┐
                │                             │
        SSR/ISR routes                  REST /api/v1/*
        (Vercel/CF Pages)              JSON, Bearer token,
                │                       refresh cookie
                │                             │
                ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                BACKEND — Spring Boot 4.0.6 (Java 21)                     │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │  api layer (controllers, DTOs, validation, OpenAPI 3.1)           │  │
│   │  application layer (services, transactions, events)               │  │
│   │  domain layer (entities, value objects, domain events)            │  │
│   │  infra layer (JPA repos, network adapters, email, R2 client)      │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│   In-process Caffeine cache  •  Bucket4j rate limit  •  Spring Security │
│   @Scheduled outbox poller (every 5s)  •  Sitemap regen (daily)         │
└────────┬────────────┬────────────┬────────────┬────────────┬────────────┘
         │            │            │            │            │
         ▼            ▼            ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ Postgres │ │  R2/S3   │ │  Resend  │ │  Google  │ │ Affiliate│
   │ (single) │ │ (logos,  │ │  (email) │ │  OAuth   │ │ Networks │
   │  Flyway, │ │ banners, │ │          │ │          │ │ (Impact, │
   │  FTS,    │ │ blog     │ │          │ │          │ │ CJ, ...) │
   │  pg_trgm)│ │ media)   │ │          │ │          │ │          │
   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### 2.2 High-level diagram — Phase 3 (scaled-out target)

```
   [Browser] [Mobile App] [Browser Extension]
                    │
              Cloudflare CDN
                    │
             ┌──────┴──────┐
        SSR (Next.js,        BFF / API Gateway
        ISR via CF KV)       (Spring Cloud Gateway)
             │                       │
             │             ┌─────────┼─────────┬──────────┬──────────┐
             │             ▼         ▼         ▼          ▼          ▼
             │       Auth svc   Catalog   Clickout    Wallet    Search svc
             │       (Spring)   (Spring)  (Spring)    (Spring)  (Spring +
             │                                                    OpenSearch)
             │             │         │         │          │          │
             │             ▼         ▼         ▼          ▼          ▼
             │        ┌────────────────────────────────────────────────┐
             │        │  Postgres primary + 2 read replicas            │
             │        │  Redis cluster (sessions, rate limit, cache)   │
             │        │  Kafka (clicks, postbacks, emails, audit)      │
             │        │  OpenSearch (catalog & coupon search)          │
             │        │  ClickHouse / BigQuery (analytics)             │
             │        │  R2/S3 (media)                                 │
             │        └────────────────────────────────────────────────┘
             ▼
       Edge functions (Cloudflare Workers) for OG image gen, redirect,
       extension lookup, hot-path fallbacks
```

The Phase 1 → Phase 3 path is incremental — every Phase 3 component has a clear "trigger to introduce" rule (§9.4), so we don't add infra ahead of demand.

### 2.3 Stack choices and justification

| Layer | Phase 1 choice | Why |
|---|---|---|
| Frontend framework | Next.js 15 App Router | Already in repo; best-in-class RSC + ISR + ImageResponse for SEO and Web Vitals |
| Frontend hosting | Vercel free/Pro **or** Cloudflare Pages | Free tier covers 100k MAU; ISR + global edge "for free" |
| State (server) | TanStack React Query | Familiar, cacheable, optimistic updates, suspense-friendly |
| State (client) | URL search params primary; Zustand for crosscutting (locale, theme) | Simple, no Redux ceremony |
| i18n | next-intl | App Router-native, locale routing, supports RTL |
| UI primitives | shadcn/ui (Radix + Tailwind) | Already adopted; accessible; full control over markup |
| Backend framework | Spring Boot 4.0.6 (Java 21) | Already in repo; enterprise-grade; virtual threads for high-concurrency clickouts |
| Auth | Spring Security + JJWT (HS256 → RS256-ready) | No need for Keycloak; we own the JWT issuer |
| Persistence | Spring Data JPA + Hibernate | Productive at this scale; we'll use `@EntityGraph` to avoid N+1 |
| Migrations | Flyway | Predictable, version-controlled; replaces `ddl-auto=update` |
| Database | PostgreSQL 16 (single primary) | ACID for ledger work later; tsvector + pg_trgm cover Phase 1 search; JSONB for flexible coupon metadata |
| Search | Postgres `tsvector` + GIN + `pg_trgm` | At ≤200k coupons easily under 200ms p95; ES deferred |
| Cache | Caffeine in-process | Simple, fast, free; covers hot reads at single-instance scale |
| CDN | Cloudflare (free) | HTML + asset caching, Cache-Tag invalidation, Brotli, image transforms |
| Object storage | Cloudflare R2 (10 GB free) | Cheaper egress than S3 |
| Email | Resend (3k/mo free) | Modern API, deliverability, locale-aware templates |
| Async | DB outbox + Spring `@Scheduled(fixedDelay=5000)` | No Kafka. Sufficient for emails / sitemap / FTS reindex at this volume |
| Rate limit | Bucket4j (in-memory) | Single-instance Phase 1; trivially swappable to Redis-backed |
| Observability | Sentry (errors), Actuator + Micrometer (metrics), JSON logs | Free tiers cover Phase 1 |
| Hosting | One backend container on Fly.io / Railway / Hetzner CX22; Postgres on Neon / Supabase / RDS-small | Sub-$50/mo total |
| CI/CD | GitHub Actions | Standard |

### 2.4 What we explicitly defer, and the trigger to add it

These tools are excellent and will be added — but only when traffic justifies the cost and complexity.

| Tool | Trigger to add | Why deferred |
|---|---|---|
| **Kafka / SQS+SNS** | Click write rate > 200/s sustained, OR outbox poller lag > 30s, OR cross-service events needed | Sync writes + 5s poller fit in Postgres at 50 rps |
| **Elasticsearch / OpenSearch** | Postgres FTS p95 > 200ms, OR coupon DB > 200k rows, OR autocomplete with synonyms required | tsvector + GIN indexes are free and fast at MVP scale |
| **Redis (cluster)** | Multi-instance backend, OR rate-limit/idempotency state must be shared | Caffeine in-process serves single instance; tiny single-node Redis ($5/mo) is the first upgrade if we need it |
| **ClickHouse / BigQuery** | Admin reports regularly scan > 1M rows, OR funnel/cohort analytics | Postgres aggregates at 3M pv/mo |
| **Read replicas** | Read queries > 70% of DB CPU | Single primary handles read+write |
| **K8s** | More than 4 backend services | One container is fine |
| **Service mesh / API gateway** | More than 2 services need shared concerns | Single monolith Phase 1 |
| **Keycloak / external OAuth provider** | Probably never | Spring Security + JJWT covers our needs |

### 2.5 Repository topology

CouponValley remains a **polyglot mono-folder** (not a true monorepo with shared tooling):

```
CouponValley/
├── frontend/couponvalley/    # Next.js 15 app (its own git repo, package.json)
├── backend/couponvalley/     # Spring Boot app (Gradle)
├── anshu-dev-doc/            # Architecture & decision docs (this file lives here)
└── CLAUDE.md                 # Root operating notes (already exists)
```

A true monorepo (Nx, Turborepo) is overkill at this size. The OpenAPI spec from backend is the contract; the frontend pulls it in CI to regenerate types. No shared code, no build orchestration.

---

## 3. Frontend Architecture

### 3.1 Folder structure (post-cleanup)

```
frontend/couponvalley/
├── app/
│   ├── layout.tsx                      # Root: ThemeProvider → IntlProvider → ReactQueryProvider
│   ├── globals.css
│   ├── (public)/                       # SSR + ISR public pages
│   │   ├── layout.tsx                  # Header + main + Footer
│   │   ├── page.tsx                    # Homepage
│   │   ├── stores/
│   │   │   ├── page.tsx                # /stores list
│   │   │   └── [slug]/
│   │   │       ├── page.tsx            # /stores/amazon-india  (ISR=60)
│   │   │       └── opengraph-image.tsx # OG image generator
│   │   ├── coupons/{page.tsx, [slug]/page.tsx}
│   │   ├── offers/{page.tsx, [slug]/page.tsx}
│   │   ├── categories/{page.tsx, [slug]/page.tsx}
│   │   ├── blog/{page.tsx, [slug]/page.tsx}
│   │   ├── search/page.tsx             # noindex
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   └── how-it-works/page.tsx
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (authed)/account/
│   │   ├── layout.tsx                  # Auth gate via cookie probe
│   │   ├── page.tsx                    # Account overview
│   │   ├── profile/page.tsx
│   │   ├── preferences/page.tsx
│   │   ├── saved-coupons/page.tsx
│   │   ├── click-history/page.tsx
│   │   └── notifications/page.tsx
│   ├── (admin)/admin/
│   │   ├── layout.tsx                  # Role gate
│   │   ├── stores/...
│   │   ├── coupons/...
│   │   ├── categories/...
│   │   ├── banners/...
│   │   ├── blog/...
│   │   ├── users/...
│   │   ├── newsletter/...
│   │   └── networks/...
│   ├── r/[couponId]/route.ts           # Server route: 302 to backend /r/{id}
│   ├── og/{store,coupon}/[slug]/route.ts  # ImageResponse OG generators
│   ├── sitemap.ts                      # Sitemap index proxy
│   └── robots.ts
├── features/                           # Per-domain UI + hooks (NOT data fetching)
│   ├── stores/components/...
│   ├── coupons/components/{CouponCard.tsx, CouponReveal.tsx, ...}
│   ├── search/{SearchInput.tsx, SearchResults.tsx, useDebouncedSearch.ts}
│   ├── account/...
│   └── admin/...
├── components/
│   ├── ui/                             # shadcn primitives (kept as-is)
│   ├── marketing/                      # Existing homepage sections (rewired)
│   │   ├── BannerSlider.tsx
│   │   ├── BrandSection.tsx
│   │   ├── PopularOffers.tsx
│   │   ├── TopCoupons.tsx
│   │   ├── TopShops.tsx
│   │   └── TrendingCategories.tsx
│   ├── layout/{Header.tsx, Footer.tsx, Breadcrumbs.tsx}
│   ├── seo/{JsonLd.tsx, StoreSchema.tsx, CouponSchema.tsx, FaqSchema.tsx, ArticleSchema.tsx, BreadcrumbSchema.tsx}
│   ├── theme/{ThemeProvider.tsx, ThemeToggle.tsx}
│   └── intl/{LocaleSwitcher.tsx}
├── lib/
│   ├── api/
│   │   ├── client.ts                   # Fetch wrapper: auth, refresh, errors, traceId
│   │   ├── generated/                  # openapi-typescript output (gitignored, regenerated in CI)
│   │   ├── stores.ts                   # Thin typed wrappers around generated client
│   │   ├── coupons.ts
│   │   ├── auth.ts
│   │   └── ...
│   ├── auth/
│   │   ├── token-store.ts              # Access token in memory (module-scoped)
│   │   ├── refresh.ts                  # Cookie-based refresh flow
│   │   └── server.ts                   # Server-only auth helpers (read cookie, call /me)
│   ├── seo/
│   │   ├── metadata.ts                 # buildMetadata() per page type
│   │   └── jsonld.ts                   # JSON-LD builders (no React)
│   ├── i18n/
│   │   ├── config.ts                   # locales, defaultLocale
│   │   ├── routing.ts
│   │   └── messages/{en.json, hi.json}
│   └── utils/{cn.ts, format.ts, slug.ts, ...}
├── hooks/
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   ├── use-debounce.ts
│   └── use-saved-coupons.ts
├── store/                              # Zustand
│   ├── locale.ts
│   └── ui.ts
├── public/
│   ├── icons/, images/
│   └── og-default.png
├── messages/                           # i18n catalogs (mirrors lib/i18n/messages)
├── types/                              # Hand-written types (DTO extensions, generic helpers)
├── middleware.ts                       # next-intl matcher; no auth here
├── next.config.mjs                     # TS strict, ESLint enforced, images optimized
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 3.2 Provider order (root layout)

```
ThemeProvider                ← next-themes
 └── NextIntlClientProvider  ← next-intl
      └── ReactQueryProvider ← @tanstack/react-query
           └── ToastProvider ← sonner
                └── {children}
```

### 3.3 Component hierarchy strategy

- **Server Components by default.** Every public page renders server-side, fetches from the backend with the user's locale, and returns ready-to-cache HTML. No client-side data fetching for SEO content.
- **Client islands** are explicit: `CouponReveal`, `SearchInput`, `SaveCouponButton`, `BannerSlider`, `LocaleSwitcher`, `ThemeToggle`. Each marked `"use client"` and as small as possible.
- **Suspense** wraps each homepage section so above-the-fold sections can stream first.
- **Loading UIs** (`loading.tsx`) per route segment for skeletons during navigation.
- **Error UIs** (`error.tsx`) per route segment with `reset()` retry.
- **Not-found** (`not-found.tsx`) for slug routes; emits real 404 status.

### 3.4 State management

| Concern | Tool | Why |
|---|---|---|
| Server state (lists, detail, search) | React Query | Caching, pagination, optimistic updates |
| URL state (filters, sort, page, q) | `useSearchParams` + `useRouter` | Shareable URLs, browser back/forward |
| Locale | Zustand + next-intl context | Cross-component, persisted to localStorage + cookie for SSR |
| Theme | next-themes (cookie + localStorage) | Already wired |
| Auth (access token) | In-memory module variable + React Context | Never in localStorage; refresh via HttpOnly cookie |
| Toasts | sonner | Single source for feedback |
| Saved-coupon optimistic UI | React Query mutate cache | Standard pattern |

**Anti-patterns avoided:** no Redux; no global form state; no SWR alongside React Query; no custom hand-rolled fetch pool.

### 3.5 Routing plan (Phase 1)

| Path | Render | Auth | Notes |
|---|---|---|---|
| `/` | RSC + cache=60 | none | Hero + sections |
| `/stores` | RSC | none | Filterable list (server-resolves URL state) |
| `/stores/[slug]` | RSC + ISR=60 | none | SEO target |
| `/coupons` | RSC | none | Paginated grid |
| `/coupons/[slug]` | RSC + ISR=60 | none | SEO target ("[brand] promo code") |
| `/offers`, `/offers/[slug]` | RSC | none | Same as coupons but no code |
| `/categories`, `/categories/[slug]` | RSC + ISR=60 | none | |
| `/blog`, `/blog/[slug]` | RSC + ISR=60 | none | Article schema |
| `/search` | RSC | none | `noindex` |
| `/about`, `/contact`, `/privacy`, `/terms`, `/how-it-works` | RSC, fully static | none | Translated copy |
| `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email` | Client | none | Form-driven |
| `/account/*` | RSC + Client | logged-in | Auth gate via server-side cookie probe |
| `/admin/*` | RSC + Client | ROLE_ADMIN | Role gate via server-side cookie probe |
| `/r/[couponId]` | Route handler (no UI) | none | Proxies to backend `/r/{id}`; 302 |
| `/og/{store,coupon}/[slug]` | Route handler `ImageResponse` | none | Cached at edge |
| `/sitemap.xml` | Route handler | none | Proxies to backend index |
| `/robots.txt` | Static | none | |

### 3.6 API contract strategy

- Backend exposes OpenAPI 3.1 at `/v3/api-docs/v1`.
- CI pulls the spec and runs `openapi-typescript` to produce `lib/api/generated/`.
- Per-module thin wrappers (`lib/api/stores.ts`, `lib/api/coupons.ts`) provide:
  - Strongly typed inputs/outputs
  - Shared `fetch` wrapper that injects bearer token, handles 401 → refresh → retry, surfaces RFC 7807 errors as typed exceptions
  - React Query `queryKey` factories (`storesKeys.list({ filter })`, `storesKeys.detail(slug)`)
- **Source of truth is the OpenAPI spec.** No hand-written DTOs on the frontend that aren't generated.

### 3.7 Auth on the frontend

```
Login flow:
1. User submits sign-in form to POST /api/v1/auth/login
2. Backend sets HttpOnly Secure SameSite=Strict cookie "cv_rt" at /api/v1/auth/
3. Backend returns { accessToken, user } in body
4. Frontend stores accessToken in module-scoped variable (memory only)
5. React Query invalidates 'auth/me' → refetch → user UI updates

Refresh flow:
1. Any API call returns 401
2. Fetch wrapper calls POST /api/v1/auth/refresh (cookie sent automatically)
3. Backend rotates refresh token (sets new cookie), returns new accessToken
4. Wrapper retries original call with new accessToken
5. Concurrent 401s coalesce to a single in-flight refresh

Logout flow:
POST /api/v1/auth/logout → backend clears cookie + revokes refresh token in DB → frontend clears in-memory token → React Query cache cleared
```

**Why this and not localStorage for tokens?** XSS-resilient; an attacker who lands JS can't steal a refresh because it's HttpOnly. Access tokens live only as long as a tab is open.

**Server components needing the user** read the cookie and call `/api/v1/users/me` server-side. There is a small `lib/auth/server.ts` helper that returns `null | UserDTO` for layout-level gating.

### 3.8 Removal list (NextAuth + Prisma)

To be deleted in Sprint 0. Total blast radius:

```
auth.ts
auth.config.ts
middleware.ts                      (will be replaced with next-intl matcher only)
app/api/auth/[...nextauth]/route.ts
components/auth/                   (entire folder)
prisma/                            (entire folder, including migrations/)
schemas/                           (Store.ts, Coupon.ts, Faq.ts, FeaturedArticle.ts, Stats.ts, ContentWriter.ts, Category.ts — all replaced by generated types)
utils/getCookies.ts
hooks/use-stores.tsx               (replaced by features/stores/hooks/use-stores.ts using generated client)
lib/api/store.ts                   (replaced by lib/api/stores.ts using generated client)
lib/axios.ts                       (replaced by lib/api/client.ts using fetch)
lib/prisma.ts
```

`package.json` deps removed: `next-auth`, `@auth/prisma-adapter`, `@prisma/client`, `prisma`, `@types/axios`, `axios`.

`next.config.mjs` changes: `eslint.ignoreDuringBuilds: false`, `typescript.ignoreBuildErrors: false`, remove `images.unoptimized: true`, add `images.remotePatterns` for R2/CDN.

`app/layout.tsx`: remove `generator: "v0.dev"` from metadata.

`tsconfig.json`: remove `../server/src/libs/decryptJWT.ts` from `include`.

---

## 4. Backend Architecture

### 4.1 Package layout

```
com.couponvalley
├── CouponvalleyApplication.java
├── common/                             # Cross-cutting
│   ├── config/                         # SecurityConfig, JpaConfig, OpenApiConfig, CacheConfig, AsyncConfig
│   ├── error/                          # GlobalExceptionHandler (RFC 7807), error codes
│   ├── audit/                          # @EntityListeners, AuditAware, audit_log writer
│   ├── idempotency/                    # @Idempotent + IdempotencyKeyService
│   ├── ratelimit/                      # Bucket4j filter
│   ├── outbox/                         # OutboxEntry entity, poller, dispatcher
│   ├── pagination/                     # CursorPage<T>
│   ├── validation/                     # custom validators
│   ├── i18n/                           # MessageSource, locale resolver
│   └── tracing/                        # Request-id filter, MDC
├── auth/
│   ├── api/{AuthController, dtos/}
│   ├── application/{AuthService, OAuthService, TokenService}
│   ├── domain/{User, OAuthAccount, RefreshToken, EmailVerificationToken, PasswordResetToken, Role}
│   └── infra/{repos, GoogleOAuthClient, JwtIssuer}
├── users/
│   ├── api/, application/, domain/, infra/
├── stores/
│   ├── api/{PublicStoresController, AdminStoresController}
│   ├── application/, domain/, infra/
├── coupons/        ...
├── categories/     ...
├── search/         ...
├── affiliates/
│   ├── domain/{AffiliateNetwork, MerchantNetworkLink}
│   ├── application/{NetworkAdapterRegistry, LinkTemplateEngine}
│   └── infra/{adapters/{ImpactAdapter, CjAdapter, AwinAdapter, RakutenAdapter, AdmitadAdapter}}
├── clicktrack/
│   ├── api/{RedirectController}
│   ├── application/{ClickService, ClickRedirectCache}
│   ├── domain/{Click}
│   └── infra/
├── conversions/
│   ├── api/{PostbackController}
│   ├── application/{PostbackService, signature/{HmacVerifier}}
│   ├── domain/{Conversion}
│   └── infra/
├── savedcoupons/   ...
├── newsletter/     ...
├── notifications/
│   ├── application/{NotificationService}
│   ├── domain/{Notification, NotificationTemplate}
│   └── infra/{EmailAdapter (port), ResendAdapter (impl)}
├── blog/           ...
├── media/
│   ├── api/{MediaController}
│   └── infra/{R2Client}
├── admin/
│   └── api/                            # Aggregate admin endpoints (delegates to module services)
└── seo/
    └── application/{SitemapGenerator (scheduled)}
```

Each module is **vertically sliced** with the four sub-packages: `api`, `application`, `domain`, `infra`. Modules talk to each other only through `application` services published in their own package — never via cross-module repository calls.

### 4.2 Module breakdown — Phase 1

#### auth
- POST `/auth/register` — email + password + locale. Sends verify email. Returns 201, no body.
- POST `/auth/login` — email + password. Returns `{accessToken, user}` + sets refresh cookie.
- POST `/auth/refresh` — uses refresh cookie. Rotates token. Returns `{accessToken}`.
- POST `/auth/logout` — revokes refresh, clears cookie.
- POST `/auth/verify-email` — `{token}`. Marks email verified.
- POST `/auth/resend-verification` — rate-limited.
- POST `/auth/forgot-password` — `{email}`. Always 202 (no leak).
- POST `/auth/reset-password` — `{token, newPassword}`. Invalidates all refresh tokens.
- GET `/auth/oauth/google/start` — returns auth URL with PKCE.
- POST `/auth/oauth/google/callback` — `{code, state, codeVerifier}` → upsert User → issue our JWT.
- Internal: BCrypt strength 12; JWT 15min HS256; refresh 30d, rotated, replay-detected.

#### users
- GET `/users/me` — current user
- PATCH `/users/me` — name, image
- PATCH `/users/me/password` — currentPassword + newPassword
- GET `/users/me/preferences` — locale, currency, email opt-ins
- PATCH `/users/me/preferences`
- GET / POST / DELETE `/users/me/addresses` (used Phase 2 for KYC + payouts)

#### stores
- Public:
  - GET `/stores?country=&category=&q=&sort=&cursor=&limit=`
  - GET `/stores/{slug}` (includes Stats, top coupons, FAQs, featured articles, similar stores)
  - GET `/stores/{slug}/coupons?status=&cursor=&limit=`
- Admin:
  - POST/PATCH/DELETE `/admin/stores` (and `/admin/stores/{id}/...` for nested resources)
  - POST `/admin/stores/{id}/logo` — presigned upload URL
  - POST `/admin/stores/{id}/restore`

#### coupons
- Public:
  - GET `/coupons?storeSlug=&category=&type=code|deal&active=true&sort=&cursor=&limit=`
  - GET `/coupons/{slug}`
- Admin:
  - POST/PATCH/DELETE `/admin/coupons`
  - POST `/admin/coupons/{id}/categories`
  - POST `/admin/coupons/{id}/restore`

#### categories
- Public:
  - GET `/categories` (tree)
  - GET `/categories/{slug}` (page metadata + paginated coupons)
- Admin:
  - POST/PATCH/DELETE `/admin/categories`

#### search
- GET `/search?q=&type=&country=&locale=&cursor=&limit=`
  - `type` = `all|store|coupon|category|blog`
  - Postgres FTS with multilingual config (`english`, `hindi` via simple-language fallback + transliteration)
  - pg_trgm fallback for fuzzy match
- GET `/search/suggest?q=` — top 8 results across types for autocomplete (returns brief titles only, fast Caffeine cache)

#### affiliates
- Admin:
  - CRUD `/admin/affiliate-networks`
  - CRUD `/admin/merchant-network-links` (links a Store to a network with a deeplink template)
- Internal services:
  - `LinkTemplateEngine.buildClickoutUrl(coupon, click)` substitutes `{merchantUrl}`, `{sub_id}`, `{click_id}`, `{advertiser_id}` into the template

#### clicktrack
- GET `/r/{couponId}?ref=...` — public, unauth or auth
  1. Resolve coupon → store → active MerchantNetworkLink (Caffeine-cached)
  2. Generate `click_id` (UUIDv7 — sortable)
  3. Build clickout URL via `LinkTemplateEngine`
  4. Persist `Click` row synchronously (single insert; sub-5ms)
  5. Increment store/coupon click counter via async `@Async` (non-blocking)
  6. Return 302 to clickout URL with `Cache-Control: no-store`
- GET `/account/clicks?cursor=&limit=` — user-scoped click history

Why synchronous? At 50 rps peak with sub-5ms inserts, single Postgres handles this. The async upgrade (Kafka or queue) is a clean swap because `ClickService.recordClick(...)` is the only call site.

#### conversions
- POST `/postback/{network}` — webhook from affiliate network
  1. Verify HMAC signature (per-network) + timestamp window (5min) + IP allowlist where supported
  2. Parse payload via `NetworkAdapter.parsePostback(body)`
  3. Lookup `Click` by `click_id` (= our `sub_id`)
  4. Idempotency: `(network, network_txn_id)` UNIQUE; if duplicate, 200 OK no-op
  5. Persist `Conversion` row in `PENDING` (Phase 1 stops here — no wallet credit)
  6. Return 200 OK

Phase 2 will add a state machine (PENDING → APPROVED → REJECTED → REVERSED) and wallet credits.

#### savedcoupons
- GET `/account/saved-coupons?cursor=&limit=`
- POST `/account/saved-coupons` `{couponId}` (idempotent)
- DELETE `/account/saved-coupons/{couponId}`

#### newsletter
- POST `/newsletter/subscribe` `{email, locale}` — sends double-opt-in email
- GET `/newsletter/confirm?token=` — confirms subscription, redirects to `/newsletter/confirmed` page
- GET `/newsletter/unsubscribe?token=` — single-click unsubscribe
- Admin: `/admin/newsletter/subscribers?cursor=&limit=` + CSV export

#### notifications
- Internal port: `EmailAdapter.send(to, locale, templateId, model)`
- ResendAdapter implementation
- Templates as Mustache files under `resources/email/<locale>/<templateId>.{subject,html,text}`
- Triggered via outbox: AuthService → outbox row → `OutboxPoller` → `EmailAdapter`

#### blog
- Public:
  - GET `/blog?cursor=&limit=&category=`
  - GET `/blog/{slug}`
- Admin:
  - CRUD `/admin/articles`, `/admin/authors`

#### media
- POST `/media/presign` (admin only) → `{uploadUrl, downloadUrl, expiresAt}` — direct R2 PUT
- After upload, admin saves the `downloadUrl` on the Store/Coupon/Article

#### i18n
- Internal `MessageSourceConfig` loads `i18n/messages_<locale>.properties`
- Locale resolver: header `Accept-Language` → cookie `cv_locale` → user preference (if authed) → default `en`

#### seo
- `SitemapGenerator` runs `@Scheduled(cron = "0 0 3 * * *")` (3am daily):
  - Pages: stores, coupons, categories, blog, offers
  - Chunks 50k URLs → uploads to R2 as `sitemaps/<type>-<n>.xml.gz`
  - Writes `sitemaps/index.xml`
  - Triggers IndexNow ping (Bing) + writes Search Console manual-submit log
- Backend serves `/sitemap.xml` as a 302 to R2 index, or proxies + sets Cache-Tag

#### admin
- Aggregator package; controllers delegate to per-module services

### 4.3 Layered architecture per module

| Layer | Annotations | Responsibilities | What's NOT allowed |
|---|---|---|---|
| `api` | `@RestController`, `@RequestMapping`, `@Validated` | HTTP, DTO mapping, validation, OpenAPI | No business logic, no JPA |
| `application` | `@Service`, `@Transactional` | Use-case orchestration, transactions, domain-event publishing | No HTTP, no SQL strings |
| `domain` | None (POJOs/records) or `@Entity` | Entities, value objects, domain events | No Spring beans (other than `@Entity`) |
| `infra` | `@Repository`, `@Component` | JPA repos, network adapters, email senders, R2 client | No business logic |

Domain events are published via Spring `ApplicationEventPublisher` in Phase 1 — synchronous and in-process. They turn into outbox rows for cross-process delivery (email send, sitemap dirty bit). Phase 2 swaps in-process for Kafka.

### 4.4 Cross-cutting concerns

**Global exception handler** returns RFC 7807 `application/problem+json` with:

```json
{
  "type": "https://docs.couponvalley.com/errors/coupon-expired",
  "title": "Coupon expired",
  "status": 410,
  "detail": "This coupon expired on 2026-04-30",
  "instance": "/api/v1/coupons/amazon-india-50-off",
  "code": "COUPON_EXPIRED",
  "traceId": "01HQ..."
}
```

Error code constants live in `common/error/ErrorCodes.java`. Frontend matches `code` not `status` for branching logic.

**Request ID**: filter generates UUIDv7, sets MDC `traceId`, returns `X-Request-Id` header. All log lines carry it.

**Audit**: `@EntityListeners(AuditingEntityListener.class)` populates `created_at`, `updated_at`. `AuditAware` reads the current `userId` from `SecurityContext` for `created_by` / `updated_by`. Admin-write events also append a row to `audit_log`.

**Validation**: Bean Validation 3.0 (`@NotBlank`, `@Email`, `@Size`, `@Pattern`, custom `@Slug`, `@CurrencyCode`).

**Compression**: `server.compression.enabled=true; server.compression.mime-types=application/json,text/html,...`

---

## 5. Database Design

### 5.1 Conventions

- All tables singular snake_case (`user`, `store`, `coupon`).
- All PKs are `UUID DEFAULT gen_random_uuid()` (extension `pgcrypto` enabled), except for natural-key tables (`region`, `currency`).
- All money columns: `NUMERIC(19,4) NOT NULL` + `currency_code CHAR(3) NOT NULL`.
- All timestamps: `TIMESTAMPTZ NOT NULL DEFAULT now()`.
- All business tables get: `created_at`, `updated_at`, `created_by UUID NULL`, `updated_by UUID NULL`.
- Soft-delete: `deleted_at TIMESTAMPTZ NULL` on Store, Coupon, Article, Banner.
- Hard delete on tokens.
- Naming: FK columns `<entity>_id`. Indexes `ix_<table>_<cols>`; uniques `uq_<table>_<cols>`; partial `ix_<table>_<cols>_<predicate>`.
- All migrations Flyway, `V001__init.sql` upward.
- `spring.jpa.hibernate.ddl-auto=validate` in non-dev profiles.

### 5.2 Phase 1 schema overview

```
users                       app users
  oauth_account             one-to-many; e.g. google→sub
  refresh_token             one-to-many; rotated, replay-detected
  email_verification_token  one-to-many; single-use
  password_reset_token      one-to-many; single-use
  user_preference           one-to-one
  notification_preference   one-to-one
  saved_coupon              user↔coupon m2m

region                      ISO 3166-1 alpha-2; seeded
currency                    ISO 4217; seeded
fx_rate                     daily snapshot (seeded; unused Phase 1)

store                       merchants
  stats                     1:1
  content_writer            1:1
  faq                       1:many
  featured_article          1:many
  merchant_network_link     store ↔ affiliate_network m2m+template

affiliate_network           Impact, CJ, Awin, Rakuten, Admitad
banner                      homepage carousel CMS

category                    hierarchical (parent_id self-FK)
coupon                      core entity
  coupon_category           m2m

click                       outbound clickout
conversion                  postback ingestion (PENDING in Phase 1)

article                     blog post
author                      blog author

newsletter_subscription     email + status + double-opt-in
notification                in-app inbox
audit_log                   admin actions, auth events
outbox                      cross-cutting events: email send, sitemap dirty, search reindex
idempotency_key             (key, method, path) → response_body, expires_at
```

### 5.3 Critical-path DDL (column-level)

#### users

```sql
CREATE TABLE app_user (                                  -- "user" is reserved
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT NOT NULL,                       -- citext for case-insensitive
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash   TEXT NULL,                             -- NULL for OAuth-only users
  name            TEXT NULL,
  image_url       TEXT NULL,
  locale          VARCHAR(10) NOT NULL DEFAULT 'en',
  country_code    CHAR(2) NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE|LOCKED|DISABLED
  failed_login_count SMALLINT NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ NULL,
  last_login_at   TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID NULL,
  updated_by      UUID NULL,
  CONSTRAINT uq_user_email UNIQUE (email)
);

CREATE TABLE user_role (                                 -- multi-role ready
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  role    VARCHAR(30) NOT NULL,                          -- USER, ADMIN, SUPER_ADMIN
  PRIMARY KEY (user_id, role)
);

CREATE TABLE user_preference (
  user_id          UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  preferred_currency CHAR(3) NOT NULL DEFAULT 'INR',
  email_opt_in     BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_digest_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE oauth_account (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  provider         VARCHAR(30) NOT NULL,                 -- google
  provider_user_id VARCHAR(200) NOT NULL,
  access_token_enc BYTEA NULL,                           -- pgcrypto-encrypted; we don't usually need this
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
);

CREATE TABLE refresh_token (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash      BYTEA NOT NULL,                        -- SHA-256 of opaque token
  parent_id       UUID NULL REFERENCES refresh_token(id),-- rotation chain
  used_at         TIMESTAMPTZ NULL,                      -- set when consumed
  revoked_at      TIMESTAMPTZ NULL,
  user_agent      TEXT NULL,
  ip_inet         INET NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash)
);
CREATE INDEX ix_refresh_token_user ON refresh_token(user_id, expires_at);

CREATE TABLE email_verification_token (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash  BYTEA NOT NULL,
  used_at     TIMESTAMPTZ NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_evt_hash UNIQUE (token_hash)
);

CREATE TABLE password_reset_token (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash  BYTEA NOT NULL,
  used_at     TIMESTAMPTZ NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_prt_hash UNIQUE (token_hash)
);
```

#### region / currency / fx_rate (seeded)

```sql
CREATE TABLE region (
  code        CHAR(2) PRIMARY KEY,                       -- ISO 3166-1 alpha-2
  name        TEXT NOT NULL,
  currency_code CHAR(3) NOT NULL REFERENCES currency(code),
  active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE currency (
  code        CHAR(3) PRIMARY KEY,                       -- ISO 4217
  name        TEXT NOT NULL,
  symbol      VARCHAR(8) NOT NULL,
  fraction_digits SMALLINT NOT NULL DEFAULT 2
);

CREATE TABLE fx_rate (                                   -- seeded, used Phase 2
  date        DATE NOT NULL,
  base        CHAR(3) NOT NULL REFERENCES currency(code),
  quote       CHAR(3) NOT NULL REFERENCES currency(code),
  rate        NUMERIC(19,8) NOT NULL,
  PRIMARY KEY (date, base, quote)
);
```

#### store + related

```sql
CREATE TABLE store (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              VARCHAR(120) NOT NULL,
  name              VARCHAR(200) NOT NULL,
  logo_url          TEXT NOT NULL,
  description       TEXT NOT NULL,
  short_description VARCHAR(280) NULL,                   -- meta description fallback
  rating            NUMERIC(3,2) NULL CHECK (rating BETWEEN 0 AND 5),
  review_count      INT NOT NULL DEFAULT 0,
  phone             VARCHAR(40) NULL,
  address           TEXT NULL,
  primary_url       TEXT NOT NULL,                       -- canonical merchant URL
  country_code      CHAR(2) NOT NULL REFERENCES region(code),
  status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE|HIDDEN|DELETED
  popularity_score  INT NOT NULL DEFAULT 0,              -- maintained by job
  search_tsv        TSVECTOR,                            -- maintained by trigger
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID NULL,
  updated_by        UUID NULL,
  deleted_at        TIMESTAMPTZ NULL,
  CONSTRAINT uq_store_slug UNIQUE (slug)
);

CREATE INDEX ix_store_country_status ON store(country_code, status) WHERE deleted_at IS NULL;
CREATE INDEX ix_store_popularity ON store(popularity_score DESC) WHERE status='ACTIVE' AND deleted_at IS NULL;
CREATE INDEX ix_store_search_tsv ON store USING gin(search_tsv);
CREATE INDEX ix_store_name_trgm ON store USING gin(name gin_trgm_ops);

CREATE TABLE store_top_offer (
  store_id    UUID NOT NULL REFERENCES store(id) ON DELETE CASCADE,
  position    SMALLINT NOT NULL,
  text        TEXT NOT NULL,
  PRIMARY KEY (store_id, position)
);

CREATE TABLE stats (
  store_id            UUID PRIMARY KEY REFERENCES store(id) ON DELETE CASCADE,
  total_offers        INT NOT NULL DEFAULT 0,
  coupon_codes        INT NOT NULL DEFAULT 0,
  in_store_coupons    INT NOT NULL DEFAULT 0,
  free_shipping_deals INT NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE content_writer (
  store_id  UUID PRIMARY KEY REFERENCES store(id) ON DELETE CASCADE,
  name      VARCHAR(200) NOT NULL,
  role      VARCHAR(120) NOT NULL,
  bio       TEXT NOT NULL,
  image_url TEXT NULL
);

CREATE TABLE faq (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID NOT NULL REFERENCES store(id) ON DELETE CASCADE,
  position   SMALLINT NOT NULL,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_faq_store ON faq(store_id, position);

CREATE TABLE featured_article (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES store(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  url         TEXT NULL,
  author      VARCHAR(200) NULL,
  position    SMALLINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### category + coupon

```sql
CREATE TABLE category (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(120) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  parent_id   UUID NULL REFERENCES category(id) ON DELETE RESTRICT,
  icon        VARCHAR(60) NULL,                          -- lucide icon name
  position    SMALLINT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_category_slug UNIQUE (slug)
);
CREATE INDEX ix_category_parent ON category(parent_id);

CREATE TABLE coupon (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(180) NOT NULL,
  store_id        UUID NOT NULL REFERENCES store(id) ON DELETE RESTRICT,
  type            VARCHAR(20) NOT NULL,                  -- CODE|DEAL|FREE_SHIPPING|IN_STORE
  code            VARCHAR(60) NULL,                      -- NULL for DEAL
  title           VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  terms           TEXT NULL,
  savings_label   VARCHAR(60) NULL,                      -- "50% OFF", "Up to ₹2000 off"
  min_purchase    NUMERIC(19,4) NULL,
  min_purchase_currency CHAR(3) NULL,
  starts_at       TIMESTAMPTZ NULL,
  expires_at      TIMESTAMPTZ NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE|EXPIRED|HIDDEN|DELETED
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  exclusive       BOOLEAN NOT NULL DEFAULT FALSE,
  used_count      INT NOT NULL DEFAULT 0,
  click_count     INT NOT NULL DEFAULT 0,
  popularity_score INT NOT NULL DEFAULT 0,
  affiliate_url_override TEXT NULL,                      -- bypass network template
  search_tsv      TSVECTOR,
  meta_title      VARCHAR(70) NULL,
  meta_description VARCHAR(170) NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID NULL,
  updated_by      UUID NULL,
  deleted_at      TIMESTAMPTZ NULL,
  CONSTRAINT uq_coupon_slug UNIQUE (slug)
);

CREATE INDEX ix_coupon_store_status ON coupon(store_id, status, expires_at) WHERE deleted_at IS NULL;
CREATE INDEX ix_coupon_active_pop ON coupon(popularity_score DESC) WHERE status='ACTIVE' AND deleted_at IS NULL;
CREATE INDEX ix_coupon_expires ON coupon(expires_at) WHERE status='ACTIVE';
CREATE INDEX ix_coupon_search_tsv ON coupon USING gin(search_tsv);
CREATE INDEX ix_coupon_title_trgm ON coupon USING gin(title gin_trgm_ops);

CREATE TABLE coupon_category (
  coupon_id   UUID NOT NULL REFERENCES coupon(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, category_id)
);
CREATE INDEX ix_coupon_category_cat ON coupon_category(category_id);

-- store↔category many-to-many for browse-by-category-store-list
CREATE TABLE store_category (
  store_id    UUID NOT NULL REFERENCES store(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  PRIMARY KEY (store_id, category_id)
);
CREATE INDEX ix_store_category_cat ON store_category(category_id);

-- search_tsv triggers (illustrative)
CREATE OR REPLACE FUNCTION coupon_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_coupon_tsv BEFORE INSERT OR UPDATE OF title, description
  ON coupon FOR EACH ROW EXECUTE FUNCTION coupon_tsv_trigger();
```

#### affiliate

```sql
CREATE TABLE affiliate_network (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(40) NOT NULL,                    -- impact, cj, awin, rakuten, admitad
  name          VARCHAR(120) NOT NULL,
  postback_secret_enc BYTEA NOT NULL,                    -- pgcrypto
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  config_json   JSONB NOT NULL DEFAULT '{}'::jsonb,      -- per-network knobs
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_aff_network_code UNIQUE (code)
);

CREATE TABLE merchant_network_link (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES store(id) ON DELETE CASCADE,
  network_id      UUID NOT NULL REFERENCES affiliate_network(id) ON DELETE RESTRICT,
  advertiser_id   VARCHAR(120) NOT NULL,                 -- network's id for the merchant
  deeplink_template TEXT NOT NULL,                       -- "https://...?u={merchantUrl}&sub_id={click_id}"
  priority        SMALLINT NOT NULL DEFAULT 0,           -- highest priority = active link
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_mnl_store_network UNIQUE (store_id, network_id)
);
CREATE INDEX ix_mnl_store_priority ON merchant_network_link(store_id, priority DESC) WHERE active;
```

#### click + conversion

```sql
CREATE TABLE click (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id      UUID NOT NULL,                           -- public sub_id (UUIDv7 sortable)
  user_id       UUID NULL REFERENCES app_user(id) ON DELETE SET NULL,
  coupon_id     UUID NOT NULL REFERENCES coupon(id) ON DELETE RESTRICT,
  store_id      UUID NOT NULL REFERENCES store(id) ON DELETE RESTRICT,
  network_id    UUID NULL REFERENCES affiliate_network(id),
  source        VARCHAR(40) NOT NULL DEFAULT 'WEB',      -- WEB|EXTENSION|EMAIL
  ip_inet       INET NULL,
  user_agent    TEXT NULL,
  referer       TEXT NULL,
  country_code  CHAR(2) NULL,
  outbound_url  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_click_id UNIQUE (click_id)
);
CREATE INDEX ix_click_user_created ON click(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX ix_click_coupon_created ON click(coupon_id, created_at DESC);
CREATE INDEX brin_click_created ON click USING brin(created_at);

CREATE TABLE conversion (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id        UUID NULL REFERENCES click(click_id),
  network_id      UUID NOT NULL REFERENCES affiliate_network(id),
  network_txn_id  VARCHAR(200) NOT NULL,                 -- network's order/transaction id
  state           VARCHAR(20) NOT NULL DEFAULT 'PENDING',-- PENDING|APPROVED|REJECTED|REVERSED
  order_amount    NUMERIC(19,4) NULL,
  order_currency  CHAR(3) NULL,
  commission_amount NUMERIC(19,4) NULL,
  commission_currency CHAR(3) NULL,
  raw_payload     JSONB NOT NULL,
  reported_at     TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_conv_network_txn UNIQUE (network_id, network_txn_id)
);
CREATE INDEX ix_conv_click ON conversion(click_id);
CREATE INDEX ix_conv_state_created ON conversion(state, created_at DESC);
```

#### saved coupons + newsletter + notifications + audit

```sql
CREATE TABLE saved_coupon (
  user_id    UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  coupon_id  UUID NOT NULL REFERENCES coupon(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, coupon_id)
);
CREATE INDEX ix_saved_user_created ON saved_coupon(user_id, saved_at DESC);

CREATE TABLE newsletter_subscription (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT NOT NULL,
  user_id       UUID NULL REFERENCES app_user(id) ON DELETE SET NULL,
  locale        VARCHAR(10) NOT NULL DEFAULT 'en',
  status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING|CONFIRMED|UNSUBSCRIBED
  confirm_token_hash BYTEA NULL,
  unsubscribe_token_hash BYTEA NOT NULL,
  confirmed_at  TIMESTAMPTZ NULL,
  unsubscribed_at TIMESTAMPTZ NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_newsletter_email UNIQUE (email)
);
CREATE INDEX ix_newsletter_status ON newsletter_subscription(status);

CREATE TABLE notification_preference (
  user_id       UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  product_email BOOLEAN NOT NULL DEFAULT TRUE,
  expiring_email BOOLEAN NOT NULL DEFAULT TRUE,
  digest_email  BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_email BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  type        VARCHAR(40) NOT NULL,                      -- COUPON_EXPIRING|...
  payload     JSONB NOT NULL,
  read_at     TIMESTAMPTZ NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_notification_user_unread ON notification(user_id, created_at DESC) WHERE read_at IS NULL;

CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID NULL REFERENCES app_user(id),
  action      VARCHAR(60) NOT NULL,                      -- STORE_CREATE, COUPON_DELETE, ...
  target_type VARCHAR(40) NOT NULL,
  target_id   UUID NULL,
  ip_inet     INET NULL,
  user_agent  TEXT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_actor_created ON audit_log(actor_id, created_at DESC);
CREATE INDEX brin_audit_created ON audit_log USING brin(created_at);
```

#### blog + banner + outbox + idempotency

```sql
CREATE TABLE author (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(120) NOT NULL,
  name        VARCHAR(200) NOT NULL,
  bio         TEXT NULL,
  avatar_url  TEXT NULL,
  CONSTRAINT uq_author_slug UNIQUE (slug)
);

CREATE TABLE article (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(180) NOT NULL,
  title        VARCHAR(200) NOT NULL,
  excerpt      VARCHAR(280) NOT NULL,
  body_md      TEXT NOT NULL,                            -- markdown
  hero_image_url TEXT NULL,
  author_id    UUID NOT NULL REFERENCES author(id) ON DELETE RESTRICT,
  status       VARCHAR(20) NOT NULL DEFAULT 'DRAFT',     -- DRAFT|SCHEDULED|PUBLISHED|HIDDEN
  published_at TIMESTAMPTZ NULL,
  scheduled_for TIMESTAMPTZ NULL,
  meta_title   VARCHAR(70) NULL,
  meta_description VARCHAR(170) NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ NULL,
  CONSTRAINT uq_article_slug UNIQUE (slug)
);
CREATE INDEX ix_article_pub ON article(published_at DESC) WHERE status='PUBLISHED' AND deleted_at IS NULL;

CREATE TABLE banner (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position      SMALLINT NOT NULL,
  title         VARCHAR(200) NOT NULL,
  subtitle      VARCHAR(280) NULL,
  image_url     TEXT NOT NULL,
  link_url      TEXT NOT NULL,
  starts_at     TIMESTAMPTZ NULL,
  ends_at       TIMESTAMPTZ NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  country_code  CHAR(2) NULL,                            -- per-region targeting
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_banner_active_pos ON banner(active, position) WHERE active;

CREATE TABLE outbox (
  id          BIGSERIAL PRIMARY KEY,
  topic       VARCHAR(60) NOT NULL,                      -- email.send|sitemap.dirty|search.reindex
  payload     JSONB NOT NULL,
  attempts    SMALLINT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ NULL,
  last_error  TEXT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_outbox_pending ON outbox(next_attempt_at) WHERE processed_at IS NULL;

CREATE TABLE idempotency_key (
  key            VARCHAR(80) NOT NULL,
  user_id        UUID NULL,
  method         VARCHAR(8) NOT NULL,
  path           TEXT NOT NULL,
  request_hash   BYTEA NOT NULL,                         -- to detect mismatched re-tries
  status_code    SMALLINT NULL,
  response_body  TEXT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at     TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (key, method, path)
);
CREATE INDEX ix_idem_expires ON idempotency_key(expires_at);
```

### 5.4 Indexing strategy summary

The doc-level indexes already appear inline above. Key rules:

- Use **partial indexes** for hot paths (`WHERE status='ACTIVE' AND deleted_at IS NULL`)
- Use **BRIN** for very large append-only tables by `created_at` (Click, AuditLog, Conversion)
- Use **GIN tsvector** for FTS, **GIN trgm** for fuzzy
- Every FK column has a supporting index unless covered by a composite
- UNIQUE on every natural-key column (slug, email, click_id, network_txn_id)

### 5.5 Money handling

- All money is `NUMERIC(19,4)` — never `DOUBLE`/`REAL`/`FLOAT8`.
- Every money column has a `*_currency CHAR(3)` neighbor — no implicit currency.
- Application layer is responsible for converting via `fx_rate` before any cross-currency comparison (Phase 2).

### 5.6 Soft delete vs hard delete

| Entity | Strategy |
|---|---|
| store, coupon, article, banner | soft (`deleted_at`) — links/SEO history matters |
| user | soft (status=DISABLED) — preserves clicks/conversions for reporting; PII can be wiped via "delete my data" job |
| token tables (refresh, evt, prt) | hard delete on use/expiry |
| click, conversion, audit_log | never deleted (append-only) |
| saved_coupon, newsletter_subscription | hard on user request |

### 5.7 Migration plan

- `V001__init_pgcrypto_citext.sql` — extensions, audit helper functions
- `V002__core_users_auth.sql` — app_user, user_role, user_preference, oauth, tokens
- `V003__seed_region_currency.sql` — ISO seed data (~250 region rows, ~180 currency rows)
- `V004__store_catalog.sql` — store, stats, content_writer, faq, featured_article, store_top_offer
- `V005__category_coupon.sql` — category, coupon, coupon_category, store_category, FTS triggers
- `V006__affiliates.sql` — affiliate_network, merchant_network_link
- `V007__clicks_conversions.sql`
- `V008__saved_newsletter_notifications.sql`
- `V009__blog_banner.sql`
- `V010__outbox_idempotency_audit.sql`
- `V011__seed_categories.sql` — top-level category tree (Fashion, Electronics, Travel, Food, Beauty, Home, Gaming...)
- `V012__seed_admin_user.sql` — first admin (env-driven password hash)

Repeatable migrations (`R__refresh_views.sql`) regenerate any materialized views.

---

## 6. API Design Strategy

### 6.1 URL conventions

- Base: `/api/v1`
- Plural nouns: `/coupons`, `/stores`
- Hyphenated kebab in paths: `/saved-coupons`, `/affiliate-networks`
- camelCase JSON keys: `{ "createdAt": "..." }`
- IDs in URLs are UUID for admin paths; **slugs for public paths** (`/stores/{slug}`)
- Admin endpoints under `/admin/...`
- Account endpoints under `/account/...` (current user) — never accept a userId in the URL for self-resources
- Versioning is in the URL (`/api/v1`, `/api/v2`); v1 stays compatible for ≥12 months past v2 release

### 6.2 Pagination

Default: **cursor-based**. The cursor is an opaque string (base64 of `{lastSortKey, lastId}`).

Request: `?cursor=eyJ...&limit=20&sort=popular`
Response:
```json
{
  "data": [...],
  "page": {
    "nextCursor": "eyJ...",
    "hasMore": true,
    "limit": 20
  }
}
```

`limit` capped at 100. Admin tables can use offset (`?page=1&pageSize=50`) since they're not user-facing.

### 6.3 Errors — RFC 7807 problem+json

Content-Type: `application/problem+json`. Always returned for 4xx/5xx.

```json
{
  "type": "https://docs.couponvalley.com/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "detail": "One or more fields are invalid",
  "instance": "/api/v1/auth/register",
  "code": "VALIDATION_FAILED",
  "traceId": "01HQ5...",
  "errors": [
    { "field": "email", "code": "EMAIL_TAKEN", "message": "Email already registered" },
    { "field": "password", "code": "PASSWORD_TOO_WEAK", "message": "Password score too low" }
  ]
}
```

Frontend matches on `code` (string constant), not status. Error code catalog lives in the doc.

### 6.4 Idempotency

All POST/PUT/PATCH/DELETE endpoints accept `Idempotency-Key: <client-generated-string>`. The backend stores `(key, method, path, requestHash)` for 24h. If the same key is replayed:
- Same request hash → return original cached response
- Different request hash → 409 `IDEMPOTENCY_KEY_MISMATCH`

### 6.5 Rate limiting

| Bucket | Limit | Backed by |
|---|---|---|
| Per-IP unauthenticated | 60 req/min, burst 100 | Bucket4j in-memory |
| Per-user authenticated | 600 req/min, burst 1000 | Bucket4j in-memory |
| Per-IP login | 10 req/min | Bucket4j |
| Per-IP register | 5 req/min | Bucket4j |
| Per-IP password-reset | 3 req/min | Bucket4j |

Response: 429 with `Retry-After` header. Phase 2: switch to Redis-backed when there's >1 backend instance.

### 6.6 OpenAPI

- springdoc-openapi-starter-webmvc-ui (already in `build.gradle`)
- `/v3/api-docs/v1` — JSON spec
- `/swagger-ui.html` — interactive (admin-gated in prod)
- Tags = module names
- Request/response examples on every endpoint
- `@SecuritySchemes`: bearer JWT, refresh cookie

### 6.7 CORS

- `cors.allowed-origins` per env (frontend URL)
- `Allow-Credentials: true` only on `/api/v1/auth/refresh` and `/api/v1/auth/logout` (the cookie-touching endpoints)
- All other endpoints use Bearer Authorization → no CORS-credential headache

### 6.8 Webhook security (postbacks from networks)

- Verify HMAC signature with per-network secret (constant-time compare)
- Verify timestamp within ±5min
- Verify source IP against network's published allowlist where available
- Idempotent on `(network, network_txn_id)`
- Always 200 OK on duplicate; 401 on bad sig; 422 on bad payload

### 6.9 Search endpoint contract

```
GET /api/v1/search
  ?q=<string>             required, 1..120 chars
  &type=all|store|coupon|category|blog
  &country=IN|US|...
  &locale=en|hi
  &cursor=
  &limit=10..50

200:
{
  "data": {
    "stores":   [{ "id", "slug", "name", "logoUrl", "snippet", "score" }, ...],
    "coupons":  [{ "id", "slug", "title", "storeName", "code?", "savingsLabel", "score" }, ...],
    "categories":[...],
    "blog":     [...]
  },
  "page": { "nextCursor": null, "hasMore": false, "limit": 20 }
}
```

`/search/suggest` returns the first 8 hits in a single flat list, optimized for autocomplete latency (Caffeine 60s).

---

## 7. Security Architecture

### 7.1 JWT (access)

- HS256 in Phase 1 (single-instance, single secret). RS256 once we have ≥2 instances and a JWKS endpoint.
- TTL: 15 minutes
- Claims: `sub` (userId), `roles`, `locale`, `iat`, `exp`, `jti` (UUID, used for blacklist if ever needed)
- Validation: signature, exp, iss (`couponvalley`), aud (`cv-web`)

### 7.2 Refresh tokens

- **Opaque** (256-bit random, base64url), stored in DB **hashed** (SHA-256). Plain value never leaves the cookie.
- TTL: 30 days
- **Rotated on every use:** new token issued, old marked `used_at`. The replacement chain is tracked via `parent_id`.
- **Replay detection:** if a token marked `used_at` is presented again, all tokens in that user's chain are revoked + alert logged. Real-world attack signature.
- **Cookie:** `Set-Cookie: cv_rt=<token>; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`
- Issued only by `/auth/login`, `/auth/refresh`, `/auth/oauth/google/callback`. Cleared by `/auth/logout`.

### 7.3 Roles

| Role | Capabilities |
|---|---|
| `USER` | Save coupons, manage profile, click out, subscribe to newsletter |
| `ADMIN` | Phase 1: full content management, view clicks/conversions, manage users |
| `SUPER_ADMIN` | Manage other admins, rotate secrets |
| `MERCHANT` | Reserved for Phase 3 |

`@PreAuthorize("hasRole('ADMIN')")` on admin endpoints. Method-level only — no URL-pattern security (prevents accidental gaps).

### 7.4 Step-up auth

Destructive admin actions require fresh password re-entry within last 5 minutes:
- Force-delete store/coupon
- Manual conversion override
- User role change
- Bulk import/export

The `/auth/step-up` endpoint accepts current password and sets `auth_level=2; auth_level_expires_at` claims on a new short-lived JWT. The destructive endpoints enforce `auth_level=2`.

### 7.5 OAuth (Google)

- **Authorization Code with PKCE**, backend-mediated
- Frontend `GET /auth/oauth/google/start` → backend returns `{authorizationUrl, state, codeVerifier}`. Frontend stores `state` and `codeVerifier` in `sessionStorage`, redirects to Google
- Google redirects back to `/auth/oauth/google/callback?code=&state=` (frontend route)
- Frontend POSTs `{code, state, codeVerifier}` to backend
- Backend exchanges code → fetches Google userinfo → upserts User and OAuthAccount → issues our JWT + refresh cookie
- **Frontend never holds Google tokens.** Only our JWT.

### 7.6 Email verification

- Token: 32-byte URLsafe, hashed in DB
- TTL: 24 hours
- Single-use (`used_at` set)
- On verify, set `email_verified = true` and invalidate all other unused tokens for that user

### 7.7 Password reset

- Token: 32-byte URLsafe, hashed in DB
- TTL: 1 hour
- Single-use
- On successful reset: invalidate all refresh tokens for that user (forces re-login on every device)

### 7.8 Account lockout

- 5 failed logins in 15 minutes → lock account for 15 minutes
- Lock is per-account AND per-IP (separate counters); whichever hits first wins
- Successful login resets counters
- Admin can manually unlock

### 7.9 Password policy

- Min 12 chars
- zxcvbn score ≥ 3 (server-side check)
- BCrypt strength 12 (configurable; benchmark to ~250ms hash on prod hardware)

### 7.10 Headers (Spring Security defaults + extras)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' <CDN>; img-src 'self' data: <R2 host>; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

CSP is tighter on `/admin` (no inline scripts, restricted img sources).

### 7.11 CSRF

- Most endpoints use Bearer Authorization → no CSRF surface
- The only cookie-auth endpoints are `/auth/refresh` and `/auth/logout`
- Both require **double-submit cookie + custom header** (`X-CSRF-Token` matches a non-HttpOnly companion cookie `cv_csrf`)
- Frontend reads `cv_csrf`, sends it back as header

### 7.12 PII at rest

- Email is `CITEXT` (not encrypted — it's a lookup key)
- `oauth_account.access_token_enc` — pgcrypto `pgp_sym_encrypt` (we rarely store these)
- `affiliate_network.postback_secret_enc` — pgcrypto
- Backups: encrypted at provider level

### 7.13 Audit log

Every admin write + every auth event (login, logout, register, verify, password reset, role change, lockout) inserts a row in `audit_log`. The table is append-only and indexed by actor + time for compliance reads.

### 7.14 Click & cashback fraud (Phase 1 prep)

- Every Click captures `ip_inet`, `user_agent`, `country_code`, `referer`, `source`
- Phase 2 fraud signals consume this: rapid-click, IP/user mismatch, postback before click (impossible in legit flow)
- Withdrawals (Phase 2) hold for ≥30 days (network typical lock window) before payout

### 7.15 Secrets management

- Phase 1: sealed env vars in deploy platform (Fly secrets, Vercel env, Hetzner systemd EnvironmentFile with 0600 perms)
- Rotation: documented runbook
- Phase 2+: AWS Secrets Manager / HashiCorp Vault when there are >2 services

### 7.16 OWASP Top 10 mapping

| Risk | Control |
|---|---|
| A01 Broken Access Control | `@PreAuthorize` everywhere; never trust client; userId from JWT only |
| A02 Cryptographic Failures | TLS-only, HSTS, BCrypt 12, hashed tokens, pgcrypto |
| A03 Injection | JPA prepared statements; no string concat SQL; input validation |
| A04 Insecure Design | Threat model documented; rate limit + lockout |
| A05 Security Misconfiguration | Spring Security default-deny; SecurityAutoConfiguration NOT excluded; security-relevant headers explicit |
| A06 Vulnerable Components | Dependabot/Renovate; weekly scan |
| A07 Identification & Authn | JWT + refresh rotation + replay detection |
| A08 Software & Data Integrity | Signed commits; release artifacts hashed; webhook signatures |
| A09 Logging & Monitoring | Structured logs + traceId; Sentry; audit_log; alerting |
| A10 SSRF | No fetching user-supplied URLs server-side; OAuth token endpoint hard-coded |

---

## 8. Caching Strategy

### 8.1 Layers

| Layer | What lives here | TTL | Invalidation |
|---|---|---|---|
| Browser | Fingerprinted assets (JS, CSS, fonts, icons, images) | 1y `immutable` | Filename hash changes |
| Cloudflare CDN | Public HTML (ISR), public JSON (`/api/v1/{stores,coupons,categories,blog,search/suggest}`) | 60s–10min via `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` + `Cache-Tag: store:<id>, coupon:<id>` | Backend admin write triggers `purge-by-tag` API call to Cloudflare |
| Caffeine in-process (backend) | Top stores by country, top coupons, category tree, JWKS, FX rates, JWT key, network configs, store→merchant_network_link lookups, `coupon_redirect` (denormalized for `/r/`) | 5–15min | App-event listener evicts on write; size-bounded LRU as backstop |
| Postgres | Query plans, tsvector indexes, page cache | OS / PG | (n/a) |

### 8.2 Cache key conventions

- `cv:v1:store:detail:<slug>`
- `cv:v1:coupon:detail:<slug>`
- `cv:v1:store:list:country:<code>:cursor:<hash>`
- `cv:v1:redirect:<couponId>`  (for hot `/r/` path)
- `cv:v1:category:tree:<locale>`
- `cv:v1:search:suggest:<locale>:<q>` (60s)

### 8.3 Cache-aside semantics

```
read(slug):
  cached = caffeine.get(key)
  if cached: return cached
  fresh = repo.find(slug)
  caffeine.put(key, fresh)
  return fresh

write(slug):
  repo.save(...)
  caffeine.invalidate(key)
  publish CacheInvalidationEvent(tag=store:<id>)
  // Phase 2: this becomes a Redis Pub/Sub message; in Phase 1 it's just in-process

CacheInvalidationListener.onEvent:
  call cloudflare.purgeByTag(tag)
```

### 8.4 Stampede control

`Caffeine.LoadingCache` ensures a single loader per key under contention.

### 8.5 Negative caching

- Detail endpoints cache 404s for 60s. Prevents scrapers from beating up the DB hunting bad slugs.

### 8.6 What we explicitly do NOT cache

- `/api/v1/users/me`, `/account/*`, `/admin/*` — user-private or fast-mutating
- Anything that includes a JWT-derived response
- `/r/{couponId}` — must always log

### 8.7 Frontend caching

- React Query `staleTime` per query class:
  - Detail (store/coupon/category): 60s
  - Lists: 30s
  - Search: 0 (always fetch fresh; rely on debounce + suggest cache)
  - `users/me`: 5min
- ISR `revalidate=60` on all detail pages
- Static pages (`/about`, `/privacy`, `/terms`): build-time, no revalidate

### 8.8 Triggers to upgrade

- Add **single-node Redis** when: refresh-token blacklist, idempotency state, or rate-limit counters need to be shared across >1 backend instance
- Move off Caffeine to **Redis cluster** when: Caffeine memory pressure (>500MB on Pod) or invalidation pub/sub becomes load-bearing
- Add **Cloudflare KV / Workers KV** when: edge-served personalization required (Phase 3)

---

## 9. Performance & Scalability

### 9.1 Latency budget (Phase 1)

| Endpoint class | p50 | p95 | p99 |
|---|---|---|---|
| Public detail (cache hit) | 20ms | 80ms | 150ms |
| Public detail (cache miss) | 40ms | 120ms | 250ms |
| Public list / search | 60ms | 200ms | 400ms |
| `/r/{id}` redirect | 10ms | 40ms | 80ms |
| Auth (login, refresh) | 100ms | 300ms | 600ms |
| Admin write | 80ms | 300ms | 600ms |

CDN cache-hit serves at <50ms TTFB globally and bypasses these numbers.

### 9.2 Frontend perf techniques (more in §11)

- ISR + RSC for HTML
- `next/image` (re-enabled), AVIF/WebP, `sizes` and explicit dimensions
- `next/font` for Inter, `display=swap`, subset
- Per-icon imports for `lucide-react` (`import { Tag } from 'lucide-react/icons/tag'`)
- Dynamic imports for non-critical UI (BannerSlider, marquee animations)
- Preconnect to API origin, R2, Cloudflare
- `Cache-Control: public, max-age=31536000, immutable` on fingerprinted assets
- Brotli compression on origin (Spring Boot)
- Skeleton loaders sized to final layout (no CLS)

### 9.3 Backend perf techniques

- HikariCP: `maximumPoolSize = (cpuCount * 2 + diskSpindles)`; ~10 for a 4-core box
- `@Transactional(readOnly=true)` on read paths — avoids dirty checking
- `@EntityGraph` and explicit fetch-joins for store-detail (one query, not N)
- No `OpenEntityManagerInViewFilter`
- `LinkTemplateEngine` is a pure function — no I/O once `MerchantNetworkLink` is loaded
- `/r/` hot path: read denormalized cache `(coupon → store → active link → template)` from Caffeine in <1ms; persist Click in single insert; 302 immediately
- Async `@Async` for click counter increments — fire-and-forget
- `OutboxPoller` runs `@Scheduled(fixedDelay=5000)`, batch size 50
- Sitemap regen at 3am daily to R2 — not on read path

### 9.4 Triggers to scale out

These are explicit thresholds, not "when it feels slow."

| Trigger | Action |
|---|---|
| Backend CPU > 60% sustained 1h, OR p95 latency exceeds budget for 1h | Add 2nd backend instance + tiny Redis for sessions/rate-limit/idempotency |
| Read query CPU > 70% of DB CPU | Add Postgres read replica; route `@Transactional(readOnly=true)` via `AbstractRoutingDataSource` |
| Click write rate > 200/s sustained, OR outbox poller lag > 30s | Introduce Kafka; `clicks.v1` topic; click consumer service |
| Postgres FTS p95 > 200ms, OR coupon DB > 200k rows, OR autocomplete with synonyms required | Introduce OpenSearch; backfill via outbox + `search.reindex` topic |
| Admin reports regularly scan > 1M rows | Stream events to ClickHouse / BigQuery |
| Backend instances > 4 OR multi-region | Move to K8s; shared Redis cluster; service mesh for inter-service calls |
| HA / 99.9% SLA required | 2 backend instances behind LB; Postgres failover replica; Cloudflare R2 already multi-region |

### 9.5 Capacity for Phase 1 (sanity check)

- **Backend instance:** 2 vCPU / 4 GB RAM (Hetzner CX22, ~€5/mo) — handles 50 rps with headroom.
- **Postgres:** Neon Pro (1 vCPU / 4 GB / 10 GB) — handles 100 qps comfortably.
- **Cloudflare:** free tier (no charge for HTML/JSON cache hits, 100k img-resize/mo free).
- **R2:** 10 GB free + 1M Class-A ops free.
- **Resend:** 3k emails/mo free, $20 for 50k/mo.
- **Sentry:** free tier (5k errors/mo).
- **Total:** under $50/mo at MVP traffic.

### 9.6 Load test plan

`k6` scenarios run weekly against staging:
- `r-clickout`: 200 rps for 5 minutes against `/r/{popularCouponId}` — assert p95 < 50ms
- `search`: 100 rps for 5 minutes — assert p95 < 200ms
- `homepage`: 200 rps for 5 minutes against ISR'd HTML — assert p95 < 100ms (mostly Cloudflare)
- `register-login`: 20 rps for 5 minutes — assert no DB connection exhaustion

---

## 10. Feature Roadmap

### 10.1 Phase 1 — MVP (8–10 weeks)

**Build:**
- Sprint 0: cleanup, foundations, CI/CD
- Sprint 1: Auth + Users
- Sprint 2: Stores + Coupons + Categories read path + Search
- Sprint 3: SEO + i18n
- Sprint 4: Clickout + Affiliates + Conversions ingestion
- Sprint 5: Newsletter + Saved Coupons + Notifications
- Sprint 6: Admin Panel
- Sprint 7: Hardening + Launch

**Features:**
- Email+password + Google OAuth, JWT refresh rotation
- Public site with all pages SSR/ISR'd, full SEO, EN+HI
- Admin panel CRUD for stores/coupons/categories/banners/blog/users/networks
- 2 affiliate networks live (Impact + CJ); URL templating + sub_id
- Clickout + click tracking
- Conversion postback ingestion (PENDING — no payouts)
- Newsletter with double opt-in
- Saved coupons
- Search via Postgres FTS

**Deliberately out of scope:** wallet, withdrawals, voting, push, extension, merchant portal, UGC, Spanish/French/Arabic, FX-priced wallets

### 10.2 Phase 2 — Cashback & engagement (6–8 weeks)

- **Wallet ledger goes live** — APPROVED conversions create credit `WalletEntry`
- **Withdrawals:** PayPal + Razorpay UPI rails, KYC checks, hold period
- **More networks:** Awin + Rakuten Advertising adapters live
- **Community:** vote_up / vote_down / mark_works / mark_broken on coupons (no submissions yet)
- **Push notifications:** FCM + per-event templates (coupon expiring, cashback approved)
- **Weekly digest email:** personalized by user's top categories from click history
- **Personalization v1:** "you might like" rail on homepage from click history
- **i18n: ES + FR + AR** (RTL audit required)
- **Multi-currency wallets:** INR + USD; FX from `fx_rate` daily snapshot
- **Infra upgrades when triggers fire:**
  - Add 2nd backend + Redis (sessions, rate limit, idempotency)
  - Possibly Postgres read replica
  - Possibly Kafka if click volume > 200/s

### 10.3 Phase 3 — Platform (8–12 weeks)

- **Browser extension** (Chrome + Firefox + Edge) — domain lookup, auto-apply, click attribution
- **Merchant self-serve portal** — onboarding, store/coupon submission, performance dashboard
- **User-submitted coupons** + admin moderation queue + fraud signals
- **Paid placements / featured slots** — billing module
- **Advanced search** — autocomplete with synonyms per locale, typo tolerance — possibly OpenSearch swap-in
- **Affiliate network #5** (Admitad) + onboarding pipeline for new networks via config
- **Blog CMS:** full editor, scheduling, SEO fields, featured images via R2

### 10.4 Phase 4 — Scale & optimization (ongoing)

- ML-based recs (matrix factorization → neural)
- Coupon expiry prediction / auto-deactivation
- Fraud detection model on clicks/conversions
- Cohort and funnel analytics — ClickHouse / BigQuery
- Mobile apps (React Native sharing types via OpenAPI)
- Data warehouse + dbt models
- A/B testing framework (server-side flag SDK; experiment table; sticky bucketing)

---

## 11. Technical SEO & Performance

This is a Phase 1 priority. Coupon traffic is dominated by long-tail organic search ("amazon india coupon code", "myntra promo code 2026") — SEO is the business.

### 11.1 Rendering rules

- Every public page is server-rendered or static. **No client-only routes for SEO content.**
- Detail pages (`/stores/[slug]`, `/coupons/[slug]`, `/categories/[slug]`, `/blog/[slug]`) use **ISR with `revalidate=60`**. CDN serves them; revalidation happens out-of-band.
- 404s use `notFound()` so Next.js returns real HTTP 404 status. Bots see 404, not 200.
- Slug renames return `301` from a backend redirect map (`store_slug_alias` table) → preserved link equity.
- Search result pages (`/search`) emit `<meta name="robots" content="noindex,follow">` to avoid duplicate-content / thin-page penalties.

### 11.2 URL structure

- Slugs everywhere. No UUIDs.
  - `/stores/amazon-india`
  - `/coupons/amazon-india-50-off-electronics`
  - `/categories/fashion`, `/categories/fashion/footwear`
  - `/blog/best-amazon-deals-may-2026`
- Hyphenated, lowercase, ASCII (transliterated for HI), ≤80 chars.
- Single canonical form: **no trailing slash**. Server redirects `/stores/foo/` → `/stores/foo` (301).
- Locale prefix:
  - English at root: `/stores/amazon-india`
  - Hindi at `/hi/`: `/hi/stores/amazon-india`
  - Each emits `<link rel="alternate" hreflang="en" href="...">`, `hreflang="hi"`, and `hreflang="x-default"`.
- Every page emits `<link rel="canonical">` pointing at the locale-correct URL with no query params (except for paginated pages which canonical to themselves with `?page=N`).

### 11.3 Metadata (per page, dynamic from DB)

Templates:

| Page | Title pattern | Description pattern |
|---|---|---|
| Homepage | `CouponValley — Coupon Codes, Cashback & Deals from 1000+ Stores` | `Save with verified coupon codes, cashback, and exclusive deals from top brands. Updated daily.` |
| Store | `{Store.name} Coupons — {N} Codes & Deals (May 2026)` | `Save with {N} verified {Store.name} coupons & promo codes. Up to {biggestSaving} off, free shipping, and more — updated {month} {year}.` |
| Coupon | `{Coupon.title} — {Store.name} Promo Code` | `{Coupon.shortDescription}. Verified {coupon.verified ? 'today' : ''}, used by {used_count}+ shoppers.` |
| Category | `Best {Category.title} Coupons & Deals — {N} Stores` | `{N} stores, hundreds of {Category.title.toLowerCase()} coupons and deals. Find the best {Category.title} discounts.` |
| Blog | `{Article.title} — CouponValley Blog` | `{Article.excerpt}` |

Lengths enforced: title ≤60 chars, description ≤160 chars (warn in admin if exceeded). Per-coupon `meta_title` and `meta_description` columns let editors override.

OpenGraph + Twitter:

```html
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:url" content="https://couponvalley.com/stores/amazon-india" />
<meta property="og:type" content="website" />
<meta property="og:image" content="https://couponvalley.com/og/store/amazon-india" />
<meta property="og:locale" content="en_US" />
<meta property="og:locale:alternate" content="hi_IN" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="..." />
```

### 11.4 OG image generation

- Route handlers: `/og/store/[slug]/route.ts`, `/og/coupon/[slug]/route.ts`
- Use Next.js `ImageResponse` (Edge runtime). Renders a 1200×630 image with brand logo, title, savings label, CV branding.
- Cached at Cloudflare for 1 day; cache-busted on logo/savings update via Cache-Tag.

### 11.5 Structured data (JSON-LD)

Components in `components/seo/` emit JSON-LD via `next/script type="application/ld+json"`.

**Sitewide (in root layout):**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CouponValley",
  "url": "https://couponvalley.com",
  "logo": "https://couponvalley.com/logo.png",
  "sameAs": ["https://twitter.com/...", "https://facebook.com/..."]
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://couponvalley.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://couponvalley.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**Store page:**
```json
{
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "Amazon India",
  "url": "https://amazon.in",
  "logo": "https://...",
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.6", "reviewCount": 12345 }
}
```
Plus `BreadcrumbList` + `FAQPage` (from store FAQs).

**Coupon page:**
```json
{
  "@context": "https://schema.org",
  "@type": "Offer",
  "name": "Amazon India 50% Off Electronics",
  "description": "...",
  "url": "https://couponvalley.com/coupons/amazon-india-50-off-electronics",
  "validFrom": "2026-05-01T00:00:00+05:30",
  "validThrough": "2026-05-31T23:59:59+05:30",
  "availability": "https://schema.org/InStock",
  "category": "Electronics",
  "eligibleRegion": { "@type": "Country", "name": "IN" },
  "offeredBy": { "@type": "Store", "name": "Amazon India", "url": "..." },
  "priceSpecification": { "@type": "UnitPriceSpecification", "priceCurrency": "INR", "price": "0" }
}
```

**Category page:** `CollectionPage` + `BreadcrumbList`

**Blog post:** `Article` (headline, image, datePublished, dateModified, author with link to `/authors/[slug]` if we expose one) + `BreadcrumbList`

**Search page:** intentionally no JSON-LD (noindex anyway).

### 11.6 Sitemap & robots

- Backend `SitemapGenerator` runs daily at 03:00 server-local
- Outputs to R2 under `sitemaps/`:
  - `index.xml` (sitemap index, ≤50 children)
  - `stores-1.xml`, `stores-2.xml`, ...
  - `coupons-1.xml`, ...
  - `categories.xml`
  - `blog.xml`
- Each sitemap ≤50k URLs (Google limit), gzipped
- `<lastmod>` from the entity's `updated_at`
- Backend serves `/sitemap.xml` as a 302 to the R2 index URL (so we get HTTP/2 + edge cache)
- After regen: ping `https://www.bing.com/indexnow?url=...&key=...` (IndexNow); log to admin "sitemap status"

`/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /account/
Disallow: /api/
Disallow: /r/
Disallow: /og/
Disallow: /search

Sitemap: https://couponvalley.com/sitemap.xml
```

### 11.7 Internal linking

- `Breadcrumbs` component on every detail page, BOTH visible and as JSON-LD `BreadcrumbList`
- Store page → "Similar stores" rail (same category, top popularity)
- Coupon page → "More coupons from {Store}" + "Other {Category} coupons"
- Category page → top stores in category
- Footer hub: top 12 categories, top 12 stores by region
- Blog post → "Related articles"

### 11.8 Core Web Vitals targets and budget

| Metric | Mobile | Desktop |
|---|---|---|
| LCP | < 2.5s | < 1.5s |
| INP | < 200ms | < 100ms |
| CLS | < 0.1 | < 0.1 |
| TTFB | < 200ms (CDN hit) | < 200ms |

JS budget per route: ≤180 KB gzipped (initial). CSS: ≤30 KB gzipped. Images on LCP: AVIF/WebP, ≤90 KB.

Lighthouse CI in pipeline asserts ≥90 on each metric for `/`, `/stores/[mock]`, `/coupons/[mock]`, `/categories/[mock]`, `/blog/[mock]`.

### 11.9 Perf techniques applied

- `next/image` re-enabled — explicit `width`, `height`, `sizes`, `priority` on LCP image, blur placeholder for non-priority
- Hero banner: priority + preloaded
- Critical CSS auto-inlined by Next.js App Router
- `next/font/google` for Inter, `display=swap`, subset Latin + Devanagari (for HI)
- Tree-shake icon imports: `import Tag from 'lucide-react/dist/esm/icons/tag'` (or proper sub-path imports)
- Dynamic import non-critical: `const BannerSlider = dynamic(() => import('@/components/marketing/BannerSlider'), { ssr: false, loading: () => <BannerSkeleton /> })`
- Preconnect: API origin, R2 hostname, Google Fonts
- DNS-prefetch: affiliate redirector hosts
- Backend `Cache-Control` per endpoint:
  - Public detail: `public, s-maxage=60, stale-while-revalidate=300`
  - Search: `public, s-maxage=30, stale-while-revalidate=120`
  - Sitemap: `public, max-age=600`
  - User-private: `private, no-store`
- ETag + 304 on all GETs (Spring Boot built-in via `ShallowEtagHeaderFilter`)
- Brotli compression (origin)

### 11.10 No-CLS layout rules

- Every `<img>` and `<Image>` has explicit `width` and `height`
- Skeletons match final element heights
- Fonts: `display=swap` with size-adjust to minimize layout shift
- Banner slider: fixed aspect-ratio container
- Toasts portal-rendered (don't push content)

### 11.11 Hreflang and i18n SEO

- Every translated page emits hreflang for all available locales + `x-default`
- Untranslated pages do **not** emit a hreflang for the missing locale (avoids broken-link signals)
- `Content-Language` HTTP header set to current locale
- URL slugs are translated/transliterated when meaningful (`/hi/स्टोर/amazon-india` only if SEO research justifies; default plan: keep slugs in EN under `/hi/` for simplicity, like Rakuten's approach)

---

## 12. Development Task Breakdown

Sprint plan for Phase 1. Each sprint ends with a deployed staging build and acceptance demo.

### Sprint 0 — Cleanup & Foundations (1 week)

**Frontend cleanup (all in `frontend/couponvalley/`):**

1. Delete the following files/folders:
   - `auth.ts`, `auth.config.ts`, `middleware.ts` (will be re-added with next-intl matcher only)
   - `app/api/auth/[...nextauth]/route.ts` (and the `app/api/auth` folder)
   - `components/auth/` (entire folder)
   - `prisma/` (entire folder)
   - `schemas/` (Store.ts, Coupon.ts, Faq.ts, FeaturedArticle.ts, Stats.ts, ContentWriter.ts, Category.ts)
   - `utils/getCookies.ts`
   - `lib/api/store.ts`, `lib/axios.ts`, `lib/prisma.ts`
   - `hooks/use-stores.tsx` (will be replaced)
2. `package.json` — drop deps: `next-auth`, `@auth/prisma-adapter`, `@prisma/client`, `prisma`, `axios`, `@types/axios`. Add: `next-intl`, `openapi-typescript` (dev), `zustand`.
3. `next.config.mjs` — `eslint.ignoreDuringBuilds=false`, `typescript.ignoreBuildErrors=false`, remove `images.unoptimized=true`, add `images.remotePatterns` for R2/CDN host.
4. `app/layout.tsx` — remove `generator: "v0.dev"` from metadata; refresh title/description.
5. `tsconfig.json` — remove `../server/src/libs/decryptJWT.ts` from `include`.
6. Add `middleware.ts` (next-intl only): matches all routes except `/api`, `/_next`, `/og`, `/sitemap.xml`, `/robots.txt`, files with extensions.
7. Smoke: `npm run lint && npx tsc --noEmit && npm run build` all clean.

**Backend foundations (all in `backend/couponvalley/`):**

8. Replace `src/main/resources/application.properties` with profiled YAML:
   - `application.yml` (defaults)
   - `application-dev.yml` (local Postgres docker-compose)
   - `application-prod.yml` (env-driven)
   - Remove `spring.autoconfigure.exclude=...SecurityAutoConfiguration` (Phase 1 has security on from day 1)
   - Remove the hardcoded password `anshu`
   - Set `spring.jpa.hibernate.ddl-auto=validate`
   - Enable `server.compression.enabled=true`
9. `build.gradle` — add: `org.flywaydb:flyway-core`, `org.flywaydb:flyway-database-postgresql`, `io.jsonwebtoken:jjwt-api/impl/jackson:0.12.x`, `com.github.ben-manes.caffeine:caffeine`, `com.bucket4j:bucket4j-core`, `org.springframework.boot:spring-boot-starter-mail` (or Resend SDK if available; otherwise direct HTTP client), `software.amazon.awssdk:s3` (R2 is S3-compatible).
10. Package skeleton:
    ```
    com.couponvalley/
      common/{config,error,audit,idempotency,ratelimit,outbox,pagination,validation,i18n,tracing}
      auth/{api,application,domain,infra}
      users/{api,application,domain,infra}
      stores/{...}
      coupons/{...}
      categories/{...}
      search/{...}
      affiliates/{...}
      clicktrack/{...}
      conversions/{...}
      savedcoupons/{...}
      newsletter/{...}
      notifications/{...}
      blog/{...}
      media/{...}
      admin/{api}
      seo/{application}
    ```
11. `db/migration/V001__init_pgcrypto_citext.sql` — extensions + helpers
12. `docker-compose.yml` at repo root — Postgres 16 + adminer; `application-dev.yml` connects.
13. SecurityConfig — enable Spring Security; default deny; permit `/api/v1/auth/**`, `/api/v1/stores/**` (GET), `/api/v1/coupons/**` (GET), `/api/v1/search`, `/api/v1/categories/**` (GET), `/api/v1/blog/**` (GET), `/api/v1/newsletter/subscribe`, `/r/**`, `/postback/**`, `/v3/api-docs/**`, `/swagger-ui/**`, `/actuator/health`. Everything else: authenticated.
14. GlobalExceptionHandler — RFC 7807 envelope.
15. RequestId filter — MDC + response header.
16. OpenAPI config — title, contact, security schemes (bearer, refresh-cookie).

**CI/CD (root):**

17. GitHub Actions workflow `frontend-ci.yml`: install + lint + typecheck + build on PR
18. GitHub Actions workflow `backend-ci.yml`: gradle build + test + spotbugs/checkstyle on PR
19. GitHub Actions workflow `openapi-sync.yml`: on backend `main` push, regenerate `frontend/couponvalley/lib/api/generated/` and open a PR
20. Staging deploy on `main`: backend → Fly.io / Railway; frontend → Vercel preview

**Acceptance:** clean repo with no NextAuth/Prisma; backend boots with security enabled; Postgres up; OpenAPI served; CI green.

### Sprint 1 — Auth + Users (2 weeks)

21. Migrations: `V002__core_users_auth.sql` (app_user, user_role, user_preference, oauth_account, refresh_token, email_verification_token, password_reset_token)
22. JJWT issuer + verifier; key from env (HS256 Phase 1)
23. BCrypt encoder bean (strength 12)
24. AuthService: register, login, refresh (rotation + replay detection), logout, verify-email, resend-verification, forgot-password, reset-password
25. OAuthService: Google PKCE start/callback, userinfo fetch, upsert
26. AuthController endpoints
27. UserService + UsersController (`/users/me`, `/users/me/preferences`)
28. Account lockout: 5/15min counters
29. zxcvbn password policy
30. Email templates: welcome (EN+HI), verify (EN+HI), reset (EN+HI). Mustache → Resend.
31. Outbox + OutboxPoller wired for email sends
32. AuditLog writer + integration with auth events
33. Frontend `lib/api/client.ts` + `lib/api/auth.ts` (against generated types)
34. `lib/auth/token-store.ts` + refresh logic (auto-retry on 401, in-flight coalescing)
35. Frontend pages: `(auth)/sign-in`, `(auth)/sign-up`, `(auth)/forgot-password`, `(auth)/reset-password`, `(auth)/verify-email`
36. Frontend `(authed)/account/{layout,page,profile,preferences}`
37. Server-side auth helper in `lib/auth/server.ts` for layout gates
38. Tests:
    - Unit tests on TokenService (rotation, replay)
    - Contract tests per auth endpoint (Spring `@WebMvcTest` + Testcontainers for Postgres)
    - Playwright e2e: sign-up → receive verify email (mock SMTP) → click link → login → refresh → logout
39. Security review: every auth endpoint exercised against OWASP cheatsheet

**Acceptance:** a real user can register on staging, receive a verify email, log in via password OR Google, refresh tokens work, account is gated, password reset works.

### Sprint 2 — Stores + Coupons + Categories read path (2 weeks)

40. Migrations:
    - `V003__seed_region_currency.sql` (ISO seeds)
    - `V004__store_catalog.sql` (store, stats, content_writer, faq, featured_article, store_top_offer)
    - `V005__category_coupon.sql` (category, coupon, coupon_category, store_category, FTS triggers)
    - `V011__seed_categories.sql` (top-level Fashion / Electronics / Travel / Food / Beauty / Home / Gaming / Books / Fitness / Baby / Phones / Motors)
41. Domain entities + JPA repositories
42. AdminStoresController CRUD; AdminCouponsController CRUD; AdminCategoriesController CRUD
43. PublicStoresController (`/stores`, `/stores/{slug}`, `/stores/{slug}/coupons`)
44. PublicCouponsController (`/coupons`, `/coupons/{slug}`)
45. PublicCategoriesController (`/categories`, `/categories/{slug}`)
46. PublicBlogController (`/blog`, `/blog/{slug}`) — uses Article entity (migration V009 deferred to Sprint 6 but stub repo here so endpoints compile)
47. Migrations `V006__affiliates.sql` (so coupon FK targets exist) — skeleton tables, full CRUD in Sprint 4
48. SearchService — Postgres FTS query with rank + pg_trgm fallback; `SearchController` (`/search`, `/search/suggest`)
49. Caffeine cache config: hot read keys
50. CacheInvalidationListener: on admin write events, evict Caffeine + invoke Cloudflare Cache-Tag purge
51. Cache-Control headers per endpoint
52. Frontend generated types refreshed
53. Frontend `lib/api/{stores,coupons,categories,search,blog}.ts`
54. Rebuild pages:
    - `/stores` (RSC, URL filter/sort state, paginated cursor)
    - `/stores/[slug]` (RSC + ISR=60, full layout — header, stats, coupons, FAQs, articles, similar)
    - `/coupons` (RSC, paginated)
    - `/coupons/[slug]` (RSC + ISR=60, full SEO)
    - `/categories` (RSC, tree)
    - `/categories/[slug]` (RSC + ISR=60, paginated coupons)
    - `/offers` and `/offers/[slug]` (= coupons of type DEAL/FREE_SHIPPING)
    - `/search` (RSC, results)
    - Header search-as-you-type wired to `/search/suggest`
55. Migrate fixtures from `frontend/couponvalley/data/{brands,coupons,categoriesData}.ts` into Flyway seed SQL (`V099__seed_phase1_demo.sql` — a demo/dev seed only, not run in prod)
56. Tests:
    - Repository slice tests with Testcontainers
    - Controller `@WebMvcTest` for each public endpoint
    - Playwright: navigate homepage → store → coupon → search

**Acceptance:** every public page on staging renders real data from Postgres; admin can CRUD stores/coupons/categories via API; search works; ISR is observed via `x-vercel-cache: HIT` (or equivalent) on second hit.

### Sprint 3 — SEO + i18n (1 week)

57. Per-page `generateMetadata()` building title/description/canonical/OG/Twitter from DTO
58. JSON-LD components in `components/seo/`: Organization, WebSite, Store, Offer, FAQPage, BreadcrumbList, Article, CollectionPage
59. OG image generators: `app/og/store/[slug]/route.ts`, `app/og/coupon/[slug]/route.ts` using Next.js `ImageResponse`
60. `app/sitemap.ts` proxies to backend `/sitemap.xml`
61. `app/robots.ts` → static `/robots.txt`
62. Backend `SitemapGenerator` (`@Scheduled` + R2 upload + IndexNow ping)
63. next-intl wired:
    - `lib/i18n/{config,routing}.ts`
    - `messages/{en,hi}.json`
    - `middleware.ts` matcher
    - Layout reads locale, sets `<html lang>` + `dir` (RTL prep)
    - All UI strings ported to message catalogs
64. Hreflang alternates emitted from `generateMetadata()`
65. `next/image` audit: every image has explicit dimensions + sizes; LCP image priority
66. Lighthouse CI added to pipeline (Mobile + Desktop, 5 representative URLs); fails PR if any metric drops below 90
67. Web Vitals tracking via `@vercel/analytics` or self-hosted endpoint
68. Indexing dry-run: Google Search Console "URL Inspection" for staging on a few URLs

**Acceptance:** Lighthouse mobile ≥ 90 across PWA-relevant categories on the 5 representative URLs; structured data validates in Google's Rich Results Test; sitemap regen succeeds; HI locale renders end-to-end.

### Sprint 4 — Clickout + Affiliates + Conversions (1.5 weeks)

69. Migrations: `V006__affiliates.sql` (full `affiliate_network`, `merchant_network_link`), `V007__clicks_conversions.sql`
70. AdminAffiliateNetworkController + AdminMerchantNetworkLinkController CRUD
71. `LinkTemplateEngine.buildClickoutUrl(coupon, click)` with template substitution + URL-encoding rules
72. `RedirectController.redirect(couponId, request)` — Caffeine `coupon_redirect` lookup; Click insert; 302
73. ClickService.recordClick — synchronous insert; async counter increments
74. Adapters: `ImpactAdapter` (production-ready), `CjAdapter` (production-ready), `AwinAdapter`/`RakutenAdapter`/`AdmitadAdapter` (stub configs ready to flip)
75. PostbackController — HMAC verification, IP allowlist, idempotency
76. ConversionService.persistPending — saves Conversion in PENDING with full raw payload
77. Frontend: every "Show Coupon" / "Get Deal" button across `CouponCard`, store-detail, coupon-detail goes to `/r/{couponId}` (frontend route handler that 302s to backend `/r/{id}` — keeps the frontend domain in browser history, helps trust)
78. Frontend `/account/click-history` page
79. Tests:
    - HMAC verifier unit tests (constant-time, replay-window)
    - Adapter URL templating snapshot tests
    - Postback contract test fixtures from each network's docs (Impact, CJ)
    - k6: `/r/` to 200 rps; assert p95 < 50ms

**Acceptance:** test postback fired with valid signature creates a Conversion in PENDING; clicking a coupon on staging redirects through the Impact deeplink; click history populated for a logged-in user.

### Sprint 5 — Newsletter + Saved Coupons + Notifications (1 week)

80. Migrations: `V008__saved_newsletter_notifications.sql`
81. NewsletterService: subscribe (double opt-in), confirm, unsubscribe; `/newsletter/*` endpoints
82. SavedCouponService: list, save, unsave; `/account/saved-coupons` endpoints
83. NotificationService + templates: welcome, newsletter-confirm, newsletter-confirmed, coupon-expiring (cron job stub for Phase 2)
84. Frontend: footer newsletter form wired (with locale)
85. Frontend: `/account/saved-coupons` page + per-card `SaveCouponButton` (optimistic UI; login wall if anon → modal redirecting to `/sign-in?next=...`)
86. Tests: end-to-end double-opt-in flow

**Acceptance:** anonymous user can subscribe, receive confirm email, click confirm, see "subscribed" page; logged-in user can save a coupon and see it persist across sessions.

### Sprint 6 — Admin Panel (1.5 weeks)

87. Migrations: `V009__blog_banner.sql`, `V010__outbox_idempotency_audit.sql` (audit_log + outbox + idempotency_key — already partly used; finalize)
88. Admin frontend route group `/admin` with role gate in `(admin)/admin/layout.tsx`
89. shadcn/ui data tables + forms for: stores, coupons, categories, banners, blog (articles + authors), users, affiliate networks, merchant network links, newsletter subscribers, click + conversion view
90. Image uploads via R2 presigned URLs (admin-only `/media/presign`)
91. Step-up auth integration on destructive actions
92. AuditLog viewing UI
93. Tests: Playwright admin happy paths

**Acceptance:** an admin user can perform every Phase 1 content operation through the UI without touching the API directly.

### Sprint 7 — Hardening + Launch (1 week)

94. Apply rate-limit filter (Bucket4j) on the documented buckets
95. Apply idempotency interceptor on all mutating endpoints
96. CSP tightening (start `report-only`, then enforce); no inline scripts on /admin
97. Dependency scan (OWASP Dependency-Check + Renovate)
98. Pen-test checklist: OWASP Top 10 walkthrough on staging
99. Load tests: clickout 200 rps, search 100 rps, public list 200 rps; assert latency budget met
100. Observability: Sentry DSN configured; Actuator metrics scraped; basic Grafana Cloud dashboard with: error rate, p50/p95/p99 latency, DB connections, JVM heap, sitemap-regen success, outbox lag
101. Alerts: 5xx rate > 1% for 5min; p95 latency over budget for 15min; outbox lag > 60s; sitemap last-success > 25h
102. Runbooks (`anshu-dev-doc/runbooks/`):
    - deploy.md
    - rollback.md
    - rotate-secret.md
    - restore-from-backup.md
    - force-purge-cdn.md
    - on-call-cheatsheet.md
103. DNS, TLS, prod env provisioning; blue/green or rolling deploy
104. Final QA pass on prod parity + soft launch (limited traffic; monitor)
105. Public launch

**Acceptance:** prod live; all alerts configured; first 1k users onboarded; SEO crawl in Search Console; first conversion postback ingested.

### Phase 2 sketch (6–8 weeks, after Phase 1 launches)

- Migrations: V100+ — wallet, wallet_entry, withdrawal, vote, did_it_work
- Wallet ledger live; APPROVED conversions create credits
- Withdrawals: PayPal + Razorpay UPI; KYC flow
- Voting + did-it-work signals on coupons
- Push notifications (FCM)
- Weekly digest email cron
- ES + FR + AR locales
- Awin + Rakuten Advertising adapters live
- Multi-currency wallets (INR + USD)
- Trigger-driven infra: introduce single-node Redis if rate-limit/idempotency need sharing across instances

### Phase 3 sketch (8–12 weeks)

- Browser extension (Chrome + Firefox + Edge)
- Extension API (domain lookup, auto-apply, attribution)
- Merchant self-serve portal
- User-submitted coupons + moderation
- Paid placements + billing
- OpenSearch swap-in (when triggered)
- Kafka swap-in (when triggered)

### Phase 4 (ongoing)

ML recs, fraud model, mobile apps, warehouse, A/B testing.

---

## Appendix A — Frontend → Backend mapping (existing components)

These existing frontend components survive into Phase 1 with rewiring, not rewrites:

| Frontend file | Action |
|---|---|
| `components/CouponCard.tsx` | Move to `features/coupons/components/CouponCard.tsx`; props become generated `CouponDto`; `Get Code` button → `/r/{id}` |
| `components/marketing/{BannerSlider,BrandSection,LogoCloud,PaymentOptionsWithRealLogos,PopularOffers,TopCoupons,TopShops,TrendingCategories}.tsx` | Move to `components/marketing/`; replace static-data imports with React Query queries against backend list endpoints; keep visual/animation code |
| `components/header.tsx` | Stay; rewire dropdowns to `useQuery(['stores','popular'])`, `useQuery(['categories','tree'])`; search → debounced `/search/suggest` |
| `components/footer.tsx` | Stay; newsletter form wires to `/newsletter/subscribe`; brand/category links to live data |
| `components/language-provider.tsx`, `components/language-toggle.tsx` | Replace with next-intl + `LocaleSwitcher` (custom provider deleted) |
| `components/theme-provider.tsx`, `components/theme-toggle.tsx` | Stay |
| `components/dashboard/*` | Repurpose for `(authed)/account/` layout |
| `components/auth/*` | Delete (NextAuth removed) |
| `components/ui/*` | Stay (shadcn primitives) |
| `data/*.ts` | Migrate into Flyway demo seed (`V099__seed_phase1_demo.sql`); delete from frontend |

## Appendix B — Critical decisions traceability

Every non-obvious choice in this doc has a one-line "why" right next to it. Quick reference for the biggest ones:

| Choice | Why |
|---|---|
| Postgres FTS over Elasticsearch (Phase 1) | At ≤200k coupons, GIN+tsvector hits target latency without ES infra. Trigger to swap is documented (§9.4). |
| Caffeine over Redis (Phase 1) | Single backend instance; in-process is faster + free. Trigger to add Redis is documented. |
| Synchronous click write over Kafka (Phase 1) | At 50 rps peak, single insert is sub-5ms. Kafka adds operational overhead with no user-visible benefit until 200+ rps. |
| Opaque refresh tokens in DB over JWT refresh | Revocable, replay-detectable. JWT refresh is stateless but can't be revoked. |
| HS256 → RS256 later, not RS256 from day 1 | Single-instance, single-secret is simpler. JWKS infra adds complexity not needed at MVP. |
| ISR on detail pages over full SSR every request | Sub-100ms global TTFB without backend per-request load. Coupon detail is "60s fresh" by user expectation. |
| URL slugs over UUIDs | SEO. `amazon-india-50-off-electronics` is a search keyword; UUID is not. |
| OpenAPI codegen over hand-written client | Single source of truth; deletes a class of "frontend and backend disagree" bugs. |
| Spring Boot over Node/Express | Already chosen by user; Java 21 + virtual threads suit high-concurrency clickouts; Spring Security is mature. |
| Cloudflare CDN free over self-hosted | $0/mo at 100k MAU; `Cache-Tag` purge API is excellent; image transforms included. |

---

**End of document.** Sprint 0 begins on approval.
