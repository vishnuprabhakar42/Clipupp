# CouponValley — Gaps, Roadmap & Technical Debt

**Document Version:** 1.0
**Date:** 2026-05-09
**Status:** Internal Working Document
**Audience:** Founders, Engineering Team

---

## 1. Executive Summary

CouponValley is approximately **40% functionally complete** for a minimum viable product and **95% complete for visual/UI design**. The application renders correctly across all screen sizes with working dark mode, four-language support including RTL Arabic, and a polished shadcn/ui component system.

However, the application has **zero revenue-generating capability today**. The affiliate click-through mechanism — the primary business model — is entirely absent. The core store listing page returns an empty result due to a missing environment variable. Only two stores (Amazon, Walmart) have functional detail pages. The email/password authentication form is a visual mock with no backend. Newsletter subscription is a console.log.

The path from current state to a launchable MVP requires approximately **8–10 weeks of focused engineering** across four areas: (1) connecting the data layer, (2) completing authentication, (3) building the affiliate redirect system, and (4) creating missing content pages.

The architecture is sound. The database schema is well-structured. The UI components are production-quality. The blockers are systemic gaps in backend wiring, not fundamental design flaws — which means the time-to-fix is shorter than it might appear.

---

## 2. Priority-Ranked Gap List

### CRITICAL — Blocks All Revenue

| # | Gap | Root Cause | Business Impact |
|---|---|---|---|
| C1 | No affiliate redirect system | Feature not built | 100% of potential revenue blocked |
| C2 | Store listing page shows empty grid | `BACKEND_URL` env var not set; axios has no baseURL | Primary SEO pages show nothing to users |
| C3 | Store detail works for 2 stores only | Hardcoded lookup in `data/brands.ts` | 95%+ of store traffic → 404 |
| C4 | Email/password auth is a fake | No CredentialsProvider; no backend endpoint | Users cannot register or log in with email |

### HIGH — Blocks Core User Flow

| # | Gap | Root Cause | Business Impact |
|---|---|---|---|
| H1 | No individual blog post pages | `/blog/[slug]` route does not exist | All blog links → 404; SEO content is unreachable |
| H2 | No individual coupon / offer pages | `/coupons/[slug]`, `/offers/[slug]` routes missing | Deep-link SEO absent; "SUMMER25 coupon code" searches → 404 |
| H3 | Newsletter subscription does nothing | `console.log` in footer handler | Cannot build email list for deal alerts |
| H4 | Header search does nothing | `console.log` in search handler | Core discovery feature missing for all users |
| H5 | No admin panel | Feature not built | Cannot add stores or coupons without direct DB access |
| H6 | Prisma field typo `updatedAT` in 7 models | Typo in schema.prisma | Silent data errors; `record.updatedAt` returns `undefined` at runtime |

### MEDIUM — Blocks Retention

| # | Gap | Root Cause | Business Impact |
|---|---|---|---|
| M1 | No saved/favorite coupons | No User↔StoreCoupon relation in schema | No reason for users to create accounts |
| M2 | Dashboard has no features beyond session display | Feature not built | Registered users have nothing to do after login |
| M3 | No click tracking or analytics | No CouponClick model; no analytics integration | Cannot measure affiliate performance or user behavior |
| M4 | All coupon data is static | No real data pipeline; data in hardcoded `.ts` files | Codes expire; data becomes stale without a deployment |
| M5 | Banner images 404 | Image files not present in `/public/images/` | Homepage hero section is broken |
| M6 | Hardcoded "RetailMeNot" copy on store pages | Not updated from template | Brand confusion; SEO penalty |
| M7 | TypeScript and ESLint disabled in build | `ignoreBuildErrors: true` in `next.config.mjs` | Bugs ship silently; technical debt accumulates invisibly |
| M8 | Middleware has no route matcher | Missing `config` export in `middleware.ts` | All routes processed by middleware; dashboard not protected at edge |

### LOW — Polish and Technical Debt

| # | Gap | Root Cause | Business Impact |
|---|---|---|---|
| L1 | All 12 homepage brands show the same logo | All import same `brandLogo.avif` | Visual credibility issue |
| L2 | All 10 coupons show Total Wine logo | All import same `totalWine.webp` | Brand mismatch on every coupon card |
| L3 | Wrong imports in `top-coupons.tsx` | Button from react-day-picker; Link from lucide-react | Latent runtime bug |
| L4 | `Category.title` has global unique constraint | Schema design issue | Cannot tag two stores with the same category name |
| L5 | `brandLogo` typed as `Json?` in StoreCoupon | Type inconsistency | API response shape inconsistency |
| L6 | Dashboard sidebar nav items are not linked | Static `<button>` elements without routing | Dashboard navigation is non-functional |
| L7 | Root layout metadata has `generator: "v0.dev"` | Not updated from scaffold | Reveals tooling; should be branded |
| L8 | Prior-project assets in `/public/images/` | Copied from a previous project | Repository bloat; potential IP issue |
| L9 | No `<head>` metadata on individual pages | Only root layout has metadata | Search ranking suffers; no Open Graph previews |
| L10 | No `loading.tsx` for most routes | Only `/stores` has a loading state | Poor perceived performance on slow connections |

---

## 3. Implementation Roadmap

### Phase 0 — Environment Setup + Immediate Bug Fixes (Week 1)

**Goal:** Make what already exists actually work. No new features.
**Effort:** 1 engineer, 5 days

- [ ] **C2:** Set `BACKEND_URL` and `NEXT_PUBLIC_BACKEND_URL` environment variables — OR — replace the axios pattern with Next.js API routes + Prisma queries (see Phase 1 for recommendation)
- [ ] **H6:** Fix `updatedAT` typo in all 7 Prisma models; run `npx prisma migrate dev`
- [ ] **M5:** Add real banner images to `/public/images/` or replace with CDN URLs
- [ ] **M6:** Replace all "RetailMeNot" text with "CouponValley" across the codebase
- [ ] **L3:** Fix wrong imports in `components/top-coupons.tsx`
- [ ] **L7:** Update `generator` tag in root metadata
- [ ] **M7:** Re-enable TypeScript checking in `next.config.mjs`; fix resulting type errors
- [ ] **L8:** Remove prior-project assets from `/public/images/png/youtube-pfp/` and `/public/images/svg/`
- [ ] Create `.env.example` documenting all required environment variables

**Deliverable:** Site renders with no console errors. Banner images display. All "RetailMeNot" copy is replaced. TypeScript errors are surfaced during builds.

---

### Phase 1 — Data Layer Connection (Weeks 2–4)

**Goal:** Replace all hardcoded data with database-driven content.
**Effort:** 1–2 engineers, 3 weeks

#### 1a — Architecture Decision: How to Serve Data

**Recommended approach — Internal Next.js API Routes + Prisma (no separate backend):**

```
app/api/stores/route.ts          → GET /api/stores (paginated, filterable)
app/api/stores/[id]/route.ts     → GET /api/stores/:id (with coupons, FAQs, stats)
app/api/coupons/route.ts         → GET /api/coupons (with type filter, pagination)
app/api/search/route.ts          → GET /api/search?q=...
```

This eliminates the separate-backend deployment complexity and uses Prisma directly on the server. The existing axios pattern in `hooks/use-stores.tsx` and `lib/api/store.ts` can point to these internal routes.

**Why not keep the external BACKEND_URL pattern:** The sibling `server/` project referenced in `tsconfig.json` is not part of this repository. Maintaining two separate deployments adds ops complexity with no benefit for a team of 1–3 engineers.

#### 1b — Database Seeding

- [ ] Write `prisma/seed.ts` with 20–30 real stores (major retailers), their StoreCoupons, FAQs, Stats, and ContentWriter entries
- [ ] Fix `Category.title` constraint: change from `@unique` to `@@unique([title, storeId])`
- [ ] Fix `brandLogo` type: change from `Json?` to `String?` in StoreCoupon

#### 1c — Connect Store Listing (`/stores`)

- [ ] Create `app/api/stores/route.ts` — return paginated stores with optional category/search filters
- [ ] Update `lib/api/store.ts` `fetchAllStores()` to call `/api/stores`
- [ ] Update `/stores/page.tsx` to show real paginated data with working search and filters

#### 1d — Connect Store Detail Pages (`/stores/[brandId]`)

- [ ] Update `app/(public)/stores/[brandId]/page.tsx` to query Prisma by slug (not `data/brands.ts`)
- [ ] Map DB Store fields to BrandPageClient props (coupons, FAQs, stats, contentWriter)
- [ ] Handle `not-found.tsx` correctly for stores that don't exist in DB

#### 1e — Connect Coupons and Offers Pages

- [ ] Create `app/api/coupons/route.ts` with type filter and pagination
- [ ] Update `/coupons/page.tsx` and `/offers/page.tsx` to fetch from API
- [ ] Add pagination (12 items per page, cursor-based)

**Deliverable:** `/stores` shows real DB data. Any seeded store's detail page works. Coupons and offers pages show real, filterable data.

---

### Phase 2 — Authentication Completion (Weeks 3–5, parallel with Phase 1)

**Goal:** Working email/password auth, confirmed OAuth, and proper route protection.
**Effort:** 1 engineer, 2 weeks

- [ ] Add `password String?` field to User model in `prisma/schema.prisma`; run migration
- [ ] Add CredentialsProvider to `auth.config.ts`:
  ```typescript
  Credentials({
    async authorize({ email, password }) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.password) return null;
      const valid = await bcrypt.compare(password as string, user.password);
      return valid ? user : null;
    }
  })
  ```
- [ ] Create `app/api/auth/register/route.ts`:
  - Validate email + password with Zod
  - Hash password with `bcrypt` (cost factor 12)
  - `prisma.user.create()`
  - Return created user or error
- [ ] Update `AuthForm.onSubmit` to call register API (sign-up) then `signIn("credentials", ...)` (sign-in)
- [ ] Add `matcher` config to `middleware.ts`:
  ```typescript
  export const config = {
    matcher: ['/dashboard/:path*']
  }
  ```
- [ ] Verify all auth environment variables are set and test full OAuth + credentials flows

**Deliverable:** Users can register and log in with email/password. OAuth works. `/dashboard` is protected at middleware level.

---

### Phase 3 — Affiliate Redirect System (Weeks 5–7)

**Goal:** Every coupon click generates trackable affiliate traffic and can produce revenue.
**Effort:** 1–2 engineers, 2–3 weeks

- [ ] Add `affiliateUrl String?` field to StoreCoupon in schema
- [ ] Add `CouponClick` model to schema:
  ```prisma
  model CouponClick {
    id        String      @id @default(uuid())
    couponId  String
    userId    String?
    sessionId String?
    ip        String?
    userAgent String?
    createdAt DateTime    @default(now())
    coupon    StoreCoupon @relation(fields: [couponId], references: [id])
  }
  ```
- [ ] Create `app/api/redirect/route.ts`:
  - Accept `GET /api/redirect?couponId=X`
  - Log click to `CouponClick` table
  - Increment `StoreCoupon.usedCount`
  - Return `redirect(affiliateUrl, 302)`
- [ ] Update all "Show Coupon" / "Get Code" buttons in `client.tsx` and `CouponCard.tsx` to navigate to `/api/redirect?couponId=X`
- [ ] Integrate an analytics service (Plausible or PostHog) for funnel tracking
- [ ] Seed StoreCoupon records with real affiliate URLs (per retailer affiliate program)

**Deliverable:** Every coupon interaction is logged. Affiliate URLs redirect users to retailer sites with tracking. Revenue is now possible.

---

### Phase 4 — Missing Content Pages (Weeks 6–8)

**Goal:** Zero 404s from internal links. All content is reachable.
**Effort:** 1 engineer, 2 weeks

- [ ] Create `app/(public)/blog/[slug]/page.tsx` with full article view and dynamic metadata
  - Extend `FeaturedArticle` model with `slug`, `content`, `category` fields OR create a standalone `BlogPost` model
- [ ] Create `app/(public)/coupons/[slug]/page.tsx` — coupon detail + affiliate redirect CTA
- [ ] Create `app/(public)/offers/[slug]/page.tsx`
- [ ] Create `app/(public)/categories/[slug]/page.tsx` — stores in that category
- [ ] Fix dashboard Sidebar nav buttons to use `next/link` routing to actual sub-routes
- [ ] Implement search: `app/api/search/route.ts` using PostgreSQL `ILIKE` or `to_tsvector` full-text search
- [ ] Add `loading.tsx` and dynamic `generateMetadata()` to all public routes

**Deliverable:** Every internal link resolves. Blog posts are indexable. Category pages drive store discovery.

---

### Phase 5 — User Features + Newsletter (Weeks 8–10)

**Goal:** Give users reasons to create accounts and return.
**Effort:** 1–2 engineers, 2–3 weeks

- [ ] Add `SavedCoupon` model to schema:
  ```prisma
  model SavedCoupon {
    id        String      @id @default(uuid())
    userId    String
    couponId  String
    createdAt DateTime    @default(now())
    user      User        @relation(...)
    coupon    StoreCoupon @relation(...)
    @@unique([userId, couponId])
  }
  ```
- [ ] Create API routes: `POST /api/coupons/[id]/save` and `DELETE /api/coupons/[id]/save`
- [ ] Add bookmark/heart icon to CouponCard; show saved state for logged-in users
- [ ] Build `/dashboard/saved` — saved coupons list
- [ ] Build `/dashboard/stores` — saved stores list
- [ ] Implement newsletter subscription:
  - Add `NewsletterSubscriber` model to schema
  - Create `POST /api/newsletter` route
  - Integrate Resend (or Mailchimp API) for email delivery
  - Update footer form `handleSubscribe` to call API
- [ ] Build `/dashboard/profile` — edit name, email, avatar

**Deliverable:** Users can save coupons, manage favorites, and subscribe to deal alerts. Dashboard is useful.

---

### Phase 6 — Admin Panel (Weeks 10–14)

**Goal:** Team and brand partners can manage content without database access.
**Effort:** 2 engineers, 4 weeks

- [ ] Add `role` field to User model: `USER | ADMIN | BRAND_PARTNER`
- [ ] Create `app/admin/` route group with role-based middleware protection
- [ ] Build store management CRUD (`/admin/stores`)
- [ ] Build coupon management CRUD (`/admin/coupons`) with affiliate URL input
- [ ] Build blog post management (`/admin/blog`)
- [ ] Add coupon verification workflow: `PENDING → VERIFIED → REJECTED`
- [ ] Add featured store placement management with tier pricing
- [ ] Build analytics dashboard: click counts, top stores, conversion rates by coupon type

**Deliverable:** Team can manage all content without DB access. Brand partners can submit and manage their own coupons.

---

## 4. Effort Summary

| Phase | Focus | Duration | Engineers | Outcome |
|---|---|---|---|---|
| Phase 0 | Bug fixes + environment | 1 week | 1 | Site works without errors |
| Phase 1 | Data layer connection | 3 weeks | 1–2 | Real store/coupon data everywhere |
| Phase 2 | Auth completion | 2 weeks | 1 | Working email/password + OAuth |
| Phase 3 | Affiliate system | 2–3 weeks | 1–2 | Revenue-generating click flow |
| Phase 4 | Missing content pages | 2 weeks | 1 | Zero internal 404s; SEO-ready |
| Phase 5 | User features + newsletter | 2–3 weeks | 1–2 | Retention loops; email list |
| Phase 6 | Admin panel | 4 weeks | 2 | Self-serve content management |
| **Total** | **Full launch** | **~16–17 weeks** | **1–2** | Production-ready platform |

**Fast-track MVP (Phases 0–4 only):** 8–10 weeks with 1 engineer working full time. This gets to a site that shows real data, has working auth, and generates affiliate revenue from click-throughs — enough to validate the business model before investing in Phase 5–6.

---

## 5. Technical Debt Items

| Debt Item | Category | Fix Effort | Risk If Ignored |
|---|---|---|---|
| TypeScript disabled in build | Quality | Medium (fix all type errors) | Bugs ship silently |
| ESLint disabled in build | Quality | Low (run lint, fix warnings) | Code quality degrades |
| No tests (unit, integration, E2E) | Quality | High (write test suite) | Regressions ship constantly |
| Prisma `updatedAT` typo in 7 models | Data | Low (migration + regenerate) | Silent data corruption |
| Hardcoded data in 5+ page files | Architecture | Medium (API routes + seeding) | Cannot update content without deploy |
| No `.env.example` file | Ops | Low (30 min) | New engineers cannot onboard |
| No error boundaries in React tree | Resilience | Low | One component crash takes down entire page |
| `brandLogo: Json?` in StoreCoupon | Data | Low (migration) | API response shape inconsistency |
| Global `Category.title @unique` | Data | Low (migration) | Store categorization broken at scale |
| No Open Graph / Twitter card metadata | SEO | Low | Social shares show no preview |
| No `sitemap.xml` | SEO | Low | Google cannot discover all pages |
| No `robots.txt` | SEO | Low | Crawlers have no guidance |
| Prior-project assets in `/public` | Cleanup | Low | Repository bloat; IP confusion |
| LanguageProvider re-renders on language change | Performance | Medium (useMemo + next-intl) | Slow perceived performance on language switch |

---

## 6. Recommended Architecture Improvements

### 6.1 Consolidate to Internal API Routes (No Separate Backend)

The current design assumes a separate backend at `BACKEND_URL`. That server does not exist in this repository. For a 1–3 engineer team, maintaining two deployments adds complexity with no benefit over Next.js API Routes + Prisma.

**Recommended:** Use Server Components with direct Prisma queries for server-rendered pages, and `app/api/` routes for client-side React Query calls. Server Actions for mutations.

### 6.2 Enable ISR for Store and Coupon Pages

Store detail pages and coupon listings are perfect ISR candidates — they change infrequently but serve high traffic and need to be indexable by Google.

```typescript
// app/(public)/stores/[brandId]/page.tsx
export const revalidate = 3600; // Rebuild every hour

// app/(public)/coupons/page.tsx
export const revalidate = 1800; // Rebuild every 30 minutes
```

### 6.3 PostgreSQL Full-Text Search (No External Search Service Needed)

For a catalog under 100,000 stores, PostgreSQL native full-text search is sufficient without Elasticsearch:

```sql
ALTER TABLE "Store" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || description)) STORED;
CREATE INDEX store_search_idx ON "Store" USING gin(search_vector);
```

Prisma can query this with `$queryRaw`. No additional infrastructure required.

### 6.4 Adopt a Consistent Data Fetching Strategy

Today the codebase mixes four patterns inconsistently. The recommended strategy going forward:

| Use Case | Recommended Approach |
|---|---|
| Public page content (stores, coupons) | RSC + Prisma direct query + `revalidate` |
| User-specific content (dashboard) | RSC + `auth()` + Prisma |
| Interactive client state (filters, search) | React Query + internal `/api/*` route |
| Form mutations (save, register, newsletter) | Server Actions |
| Real-time updates (future: deal alerts) | Server-Sent Events |

### 6.5 Replace Custom i18n with `next-intl`

The current `LanguageProvider` stores all translations in a single in-memory object and re-renders the entire component tree on language change. Migrating to `next-intl` provides:
- Per-locale JSON files (lazy-loaded, not bundled together)
- No full-tree re-renders
- Type-safe translation keys
- Proper `Accept-Language` header detection

The existing translation key structure is compatible with `next-intl`.

### 6.6 Create `.env.example` Immediately

This is the single 30-minute task with the highest ROI. It unblocks new engineer onboarding, clarifies what's needed to make the site work, and makes the `/stores` page functional as soon as the vars are set:

```bash
# .env.example
DATABASE_URL=postgresql://user:pass@host:5432/couponvalley
AUTH_SECRET=                    # openssl rand -base64 32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000  # or remove if using internal API routes
BACKEND_URL=http://localhost:3000              # or remove if using internal API routes
RESEND_API_KEY=                 # for newsletter email delivery
```
