# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Frontend-specific notes (Clean Blue palette, route groups, image contract, auth singleton, OG-route hex exceptions) live in `frontend/clipupp/CLAUDE.md`. Read both when working across stacks.

## Repository shape

Two-app monorepo. There is no root-level package manager, lockfile, or workspace tool — each app is operated from its own directory:

- `backend/clipupp/` — Spring Boot 4 / Java 21 / Gradle wrapper
- `frontend/clipupp/` — Next.js 15 App Router (npm)

Do not run commands from the repo root; `cd` into the app directory you're working in.

## Commands

### Backend (`backend/clipupp/`)

```bash
./gradlew bootRun                                   # run dev server on :8080 (auto-applies Flyway, profile=dev)
./gradlew test                                      # JUnit 5 + Testcontainers (Postgres)
./gradlew test --tests JwtIssuerTest                # run one test class
./gradlew build                                     # full build incl. tests; produces build/libs/app.jar
./gradlew bootJar                                   # build runnable jar only
SPRING_PROFILES_ACTIVE=prod ./gradlew bootRun       # run with prod profile (requires all env vars set)
```

The dev profile is the default (`application.yml` defaults `SPRING_PROFILES_ACTIVE` to `dev`). The dev profile expects a **local Postgres** at `localhost:5432`, db `clipupp_db`, user `postgres`, password `anshu`. Flyway runs on startup and applies `src/main/resources/db/migration/V*__*.sql` plus the `R__seed_dev_data.sql` repeatable seed.

Dev-only utilities live under `/api/v1/dev/**` (loaded only when `@Profile("dev")`) — including `POST /api/v1/dev/seed` to populate categories, 15 stores, coupons, banners, and three users (admin/editor/user).

### Frontend (`frontend/clipupp/`)

```bash
npm run dev          # dev server on :3000
npm run build        # production build (type/lint errors NOT surfaced — see below)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (explicit — next.config.mjs suppresses build-time errors)
npm run openapi:gen  # regenerate lib/api/generated/schema.ts from running backend's /v3/api-docs/v1
```

`next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` — `npm run build` will NOT fail on type/lint errors. Run `npm run typecheck` and `npm run lint` explicitly for real checks. No JS test runner is configured.

## Architecture — big picture

### How the two apps talk

The browser **never** talks to the backend directly. `next.config.mjs` rewrites `/api/v1/*`, `/r/*`, `/postback/*`, `/v3/api-docs/*`, `/swagger-ui/*`, `/actuator/*` to `BACKEND_URL` so the browser always sees same-origin requests. This is **load-bearing for auth**: the `cv_rt` HttpOnly refresh cookie is set on the Next.js origin (`localhost:3000`) and travels on navigations. Server components in Next.js bypass the rewrite and hit `BACKEND_URL` directly so they don't double-hop.

### Auth flow (cross-stack)

The Java backend (`auth/` module) is the single source of truth — there is **no NextAuth**, no DB access from the frontend.

1. `POST /api/v1/auth/login` → backend returns `accessToken` in JSON and sets `cv_rt` as HttpOnly cookie.
2. Frontend stores the access token in-memory only (`lib/auth/token-store.ts`).
3. On 401, `lib/api/client.ts` calls `lib/auth/refresh.ts:refreshAccessToken()` (a **singleton** — direct calls to `/api/v1/auth/refresh` race and trip the backend's replay-detection).
4. `/api/v1/auth/refresh` is **non-rotating**: it mints a new access token but keeps the same refresh token. Only login rotates the refresh token.
5. Server components use `lib/auth/server.ts:getServerSession()` (wrapped in React `cache()`) → reads `cv_rt` and hits `/users/me`.

Roles: `USER`, `ADMIN`, `SUPER_ADMIN`, `MERCHANT`. **ADMIN and SUPER_ADMIN are NOT hierarchical** in backend `@PreAuthorize` checks — every admin endpoint uses `@PreAuthorize("hasRole('ADMIN')")`, so granting only `SUPER_ADMIN` does not unlock the admin portal. Roles are stored in the `user_role` table (not `app_user_role`).

Backend security defaults to deny-all. The public allowlist in `common/config/SecurityConfig.java` permits only `GET` on `/api/v1/{stores,coupons,categories,offers,blog,banners,legal-pages,homepage,settings/public,campaigns,search}/**`, `POST /api/v1/newsletter/subscribe`, and the `/r/**` + `/postback/**` redirect/affiliate tracking paths. Everything else requires an authenticated bearer token.

### Backend module layout

Each business domain lives at `com.clipupp.<module>/{api,application,domain,infra}` (23 modules — `auth`, `users`, `stores`, `coupons`, `categories`, `affiliates`, `clicktrack`, `conversions`, `savedcoupons`, `newsletter`, `notifications`, `blog`, `banner`, `campaigns`, `home`, `legalpages`, `media`, `search`, `seo`, `settings`, `analytics`, `admin`, plus dev-only `dev`). Conventions:

- `api/` — `@RestController` + DTOs; controllers are prefixed `Public*` (public endpoints) or `Admin*` (under `/api/v1/admin/**`, all `@PreAuthorize("hasRole('ADMIN')")`)
- `application/` — services, transaction boundaries
- `domain/` — JPA entities, enums, value objects
- `infra/` — Spring Data repositories, external adapters (e.g. `GoogleTokenVerifier`, `JwtIssuer`)

Cross-cutting infrastructure lives under `common/`: `audit`, `outbox` (transactional outbox pattern — poller runs every 5s), `idempotency`, `pagination` (cursor encoder for public APIs, Spring offset pages for admin), `ratelimit` (Bucket4j, in-memory), `error`, `tracing`, `i18n`, `text` (slugifier), `validation`. Config classes (cache, security, Jackson, JWT, Flyway, media, OpenAPI, HTTP caching) sit in `common/config/`.

The app boots from `CouponvalleyApplication.java` with `@EnableJpaAuditing`, `@EnableScheduling`, `@EnableAsync`, `@EnableCaching` all enabled. Caches are Caffeine (in-process). **Cache eviction rule:** writes to `store`, `coupon`, or `category` must evict **both** `homepage.top` AND `homepage.layout` — the trending rail and featured grid read embedded data from the layout cache, so busting only `homepage.top` leaves stale logos/titles. See the cache-related notes in `frontend/clipupp/CLAUDE.md`.

Java 21 virtual threads are enabled (`spring.threads.virtual.enabled: true`). `open-in-view` is `false` — fetch eagerly inside services.

### Pagination conventions

- **Public** endpoints (`/api/v1/coupons`, `/api/v1/stores`, etc.) → cursor-based `CursorPage<T>` (opaque encoded cursor). Use `common/pagination/CursorEncoder`.
- **Admin** endpoints (`/api/v1/admin/**`) → Spring's offset-based `SpringPage<T>` (`page`/`size`/`sort`).

Both shapes are mirrored in `frontend/clipupp/lib/api/types.ts`. Don't mix them on the wrong tier.

### Frontend route groups (`app/[locale]/`)

- `(public)/` — home, stores, coupons, offers, categories, blog, search, newsletter, legal pages
- `(auth)/` — sign-in/up, forgot/reset password, verify email
- `(authed)/account/*` — requires session
- `(admin)/admin/*` — requires `ADMIN` role; sidebar groups: Dashboard | Site | Catalog | Content | Affiliates | People
- OG image routes at `app/og/{store,coupon}/[slug]/route.tsx` run on the **edge runtime** and cannot read CSS vars — they mirror the brand palette inline (see frontend CLAUDE.md "legitimate hex exceptions").

i18n via `next-intl` with `[locale]` URL prefix and `cv_locale` cookie. Feature code is split by domain in `features/` (auth, catalog, admin, home, newsletter, savedcoupons, site) — see frontend CLAUDE.md for the inventory.

## Migrations and data

- Migrations: `backend/clipupp/src/main/resources/db/migration/V###__*.sql`. Always create a new `V###__*.sql` — never edit a committed migration. `out-of-order: false` in `application.yml`, so the numeric sequence is strict.
- `R__seed_dev_data.sql` is a Flyway **repeatable** migration that re-runs whenever its checksum changes; safe to edit.
- The DB schema covers users/auth, stores/catalog, coupons, affiliates, clicks/conversions, saved coupons + newsletter, blog/banners, legal pages, homepage layout/sections, site settings, analytics views, campaigns. The `homepage_section` table drives the admin's drag-reorder editor — keys must match the `SECTION_RENDERERS` map in `app/[locale]/(public)/page.tsx`.

## Required environment variables

### Backend

`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` (≥32 bytes), `CORS_ALLOWED_ORIGINS`, `PUBLIC_SITE_URL`, `API_BASE_URL`. Email: `EMAIL_PROVIDER` (`resend`|`logging`), `EMAIL_FROM`, `RESEND_API_KEY`. Media (Cloudflare R2, S3-compatible): `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `R2_ENDPOINT`, `R2_REGION`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`. Google OAuth: `GOOGLE_CLIENT_ID`.

**Dev profile note:** `application-dev.yml` checks in concrete dev values (local Postgres creds, dev JWT secret, and **live R2 credentials**) so the Gradle daemon doesn't silently drop env vars between runs. The comment in that file flags the R2 keys for rotation — treat them as live secrets, not placeholders. Prod still reads from env vars via `application.yml`.

### Frontend

- `NEXT_PUBLIC_API_BASE_URL` — client-side API base URL (default `http://localhost:8080`); the rewrite makes the actual browser URL same-origin.
- `BACKEND_URL` — server-side API base URL; used by `next.config.mjs` rewrites and direct server-component fetches.

Image `remotePatterns` in `next.config.mjs` is an explicit allowlist (`*.r2.dev`, `*.r2.cloudflarestorage.com`, `**.cloudfront.net`, `logo.clearbit.com`, `images.unsplash.com`, `api.dicebear.com`, `upload.wikimedia.org`, `placehold.co`). Add new hosts there before using `next/image` against them.

## Scale and stack philosophy

Phase 1 targets ~100k MAU on a deliberately lean stack: Postgres + Caffeine in-process cache + Bucket4j in-memory rate limiting + R2 for media. No Kafka, no Elasticsearch, no Redis cluster, no ClickHouse yet — defer until concrete scale triggers force them. Search uses Postgres; outbox + idempotency tables stand in for a message broker. **Phase 1 is coupons only**; cashback is deferred. User-facing copy must use "deals" / "coupons" / "save", never "cashback" — even though a `cashbackRate` field still exists on the store DTO it is repurposed as a generic "deal label" string.
