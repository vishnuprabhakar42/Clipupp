# CouponValley — Technical Analysis

**Document Version:** 1.0
**Date:** 2026-05-09
**Status:** Internal Working Document
**Audience:** Engineering Team

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│                                                                 │
│  React 18 + Next.js 15 App Router (Client Components)          │
│  Tailwind CSS + shadcn/ui + Framer Motion                       │
│  React Query v5 (TanStack) + Axios                              │
│  next-themes (dark/light) + custom LanguageProvider (i18n)      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP / RSC
┌──────────────────────────────▼──────────────────────────────────┐
│                    NEXT.JS 15 SERVER                            │
│                                                                 │
│  App Router (RSC + Server Actions)                              │
│  Route Groups: (auth), (public), dashboard                      │
│  NextAuth v5 beta (JWT strategy)                                │
│  PrismaAdapter → NextAuth session storage                       │
│  Prisma ORM 6 → PostgreSQL                                      │
│                                                                 │
│  ┌───────────────────┐  ┌──────────────────────────────────┐   │
│  │   Static Data     │  │  API Layer (MISSING / BROKEN)     │   │
│  │   data/*.ts       │  │  BACKEND_URL env var not set      │   │
│  │   (brands,        │  │  → axios calls fail silently      │   │
│  │    coupons,       │  │  → /stores page renders empty     │   │
│  │    categories)    │  │  → No /api/* routes exist         │   │
│  └───────────────────┘  └──────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Prisma / TCP
┌──────────────────────────────▼──────────────────────────────────┐
│                       PostgreSQL                                 │
│                                                                 │
│  Auth tables: User, Account, Session, VerificationToken         │
│  Business:    Store, StoreCoupon, Stats, ContentWriter,         │
│               FeaturedArticle, FAQ, Category                    │
│                                                                 │
│  Migrations: 2 applied                                          │
│  (20250618035104_initialized, 20250618041510_second_mig)        │
└─────────────────────────────────────────────────────────────────┘

NOTE: There is no separate backend/API server in this repository.
      The architecture assumes one at BACKEND_URL but none exists.
      All store data currently comes from hardcoded TypeScript files.
```

---

## 2. Complete File Structure

```
couponvalley/
│
├── app/                                # Next.js 15 App Router root
│   ├── layout.tsx                      # Root layout: ThemeProvider → LanguageProvider → ReactQueryProvider
│   ├── globals.css                     # Global Tailwind base styles + CSS variables
│   │
│   ├── (auth)/                         # Auth route group (no shared layout)
│   │   ├── sign-in/page.tsx            # Renders <AuthForm initialMode="login" />
│   │   └── sign-up/page.tsx            # Renders <AuthForm initialMode="signup" />
│   │
│   ├── (public)/                       # Public route group
│   │   ├── layout.tsx                  # Wraps: <Header /> + {children} + <Footer />
│   │   ├── page.tsx                    # Homepage: 8 Suspense-wrapped sections
│   │   ├── coupons/page.tsx            # 12 hardcoded coupons grid
│   │   ├── offers/page.tsx             # 9 hardcoded offers grid
│   │   ├── blog/page.tsx               # 6 hardcoded blog posts (article links → 404)
│   │   ├── categories/page.tsx         # Category browser — static data, functional
│   │   └── stores/
│   │       ├── page.tsx                # Store listing — axios call, currently blank
│   │       ├── loading.tsx             # Loading skeleton for store listing
│   │       └── [brandId]/
│   │           ├── page.tsx            # Looks up brand in data/brands.ts (2 entries only)
│   │           ├── client.tsx          # Full store detail UI (~430 lines)
│   │           ├── loading.tsx         # Loading skeleton
│   │           └── not-found.tsx       # 404 page for unknown stores
│   │
│   ├── dashboard/
│   │   ├── layout.tsx                  # auth() check + Sidebar + Header + Footer
│   │   └── page.tsx                    # Shows user avatar, name, email, session expiry
│   │
│   └── api/
│       └── auth/[...nextauth]/route.ts # NextAuth GET + POST handler
│
├── components/
│   ├── header.tsx                      # Sticky nav, search, theme/language toggles, sign-in link
│   ├── footer.tsx                      # 4-column footer with newsletter form (no-op)
│   ├── banner-slider.tsx               # Auto-play carousel, 3 hardcoded banners (images 404)
│   ├── brand-section.tsx               # 12 hardcoded store logos (all same avif image)
│   ├── top-coupons.tsx                 # 10 items from data/coupons.ts [BUG: wrong imports]
│   ├── top-shops.tsx                   # 8 hardcoded shops with emoji icons
│   ├── trending-categories.tsx         # Category tabs + filtered coupon cards
│   ├── popular-offers.tsx              # 3-tab offers display (popular/trending/exclusive)
│   ├── CouponCard.tsx                  # Reveal + copy coupon card
│   ├── PaymentOptionsWithRealLogos.tsx # Payment method logos strip
│   ├── language-provider.tsx           # Context: 4 languages (EN/ES/FR/AR), RTL toggle
│   ├── language-toggle.tsx             # UI dropdown for language switching
│   ├── theme-provider.tsx              # next-themes wrapper
│   ├── theme-toggle.tsx                # UI toggle for dark/light/system
│   │
│   ├── auth/
│   │   ├── AuthForm.tsx                # Email/password form with Zod (fake submit)
│   │   ├── AuthModal.tsx               # Modal wrapper for auth form
│   │   ├── FormError.tsx               # Error message component
│   │   ├── FormSuccess.tsx             # Success message component
│   │   ├── GoogleAuthButton.tsx        # signIn("google") → /dashboard
│   │   ├── GithubAuthButton.tsx        # signIn("github") → /dashboard
│   │   ├── LogoutButton.tsx            # signOut() wrapper
│   │   ├── NotAuthenticated.tsx        # Access-denied page component
│   │   └── Separator.tsx               # "OR" divider between form and OAuth buttons
│   │
│   ├── dashboard/
│   │   ├── Sidebar.tsx                 # Collapsible sidebar (3 unlinked nav buttons)
│   │   ├── Header.tsx                  # Dashboard top bar
│   │   ├── Footer.tsx                  # Dashboard footer
│   │   └── UserDropdown.tsx            # User menu in dashboard header
│   │
│   ├── LogoCloud/
│   │   └── LogoCloud.tsx               # Static brand logo grid (social proof strip)
│   │
│   ├── providers/
│   │   └── react-query-provider.tsx    # QueryClient + QueryClientProvider wrapper
│   │
│   └── ui/                             # 40+ shadcn/ui components
│       └── [accordion, alert, badge, button, calendar, card, carousel,
│            chart, command, dialog, dropdown-menu, form, input,
│            navigation-menu, pagination, select, sheet, skeleton,
│            slider, tabs, table, toast, tooltip, ...]
│
├── data/                               # Static fallback data (only working data source)
│   ├── brands.ts                       # Brand[] — Amazon and Walmart only (full objects)
│   ├── coupons.ts                      # Coupon[] — 10 items, all using totalWine logo
│   └── categoriesData.ts               # Category tree with icons, colors, subcategories
│
├── hooks/
│   ├── use-mobile.tsx                  # Responsive breakpoint detection hook
│   ├── use-stores.tsx                  # React Query hook → fetchAllStores → broken API
│   └── use-toast.ts                    # Toast notification hook
│
├── lib/
│   ├── axios.ts                        # Axios instance — baseURL from env vars (both unset) ❌
│   ├── prisma.ts                       # Singleton PrismaClient
│   ├── utils.ts                        # cn() classname merging utility
│   └── api/
│       └── store.ts                    # fetchAllStores() → api.get("/stores")
│
├── schemas/                            # Zod schemas mirroring Prisma models
│   ├── Store.ts                        # StoreSchema with nested relations
│   ├── Coupon.ts                       # CouponSchema (StoreCoupon)
│   ├── Category.ts                     # CategorySchema
│   ├── ContentWriter.ts                # ContentWriterSchema
│   ├── Faq.ts                          # FAQSchema
│   ├── FeaturedArticle.ts              # FeaturedArticleSchema
│   └── Stats.ts                        # StatsSchema
│
├── utils/
│   └── getCookies.ts                   # Reads "authjs.session-token" cookie server-side
│
├── prisma/
│   ├── schema.prisma                   # Data models (PostgreSQL)
│   └── migrations/
│       ├── 20250618035104_initialized/ # Initial migration
│       └── 20250618041510_second_mig/  # Second migration
│
├── public/                             # Static assets
│   ├── placeholder*.{png,svg,jpg}      # shadcn placeholder images
│   └── images/
│       ├── png/                        # Brand logos (+ youtube-pfp from prior project)
│       ├── svg/                        # Tech stack icons (from prior project)
│       └── webp/                       # brandLogo.avif, sbiLogo.webp, totalWine.webp
│
├── auth.ts                             # NextAuth config: PrismaAdapter + authConfig
├── auth.config.ts                      # Providers: Google, GitHub. signIn page: /sign-in
├── middleware.ts                       # Exports NextAuth middleware (no route matcher config)
├── next.config.mjs                     # TS errors off, ESLint off, images unoptimized
├── tailwind.config.ts                  # Tailwind + custom animation config
├── tsconfig.json                       # TypeScript config, @/* alias to root
├── components.json                     # shadcn/ui configuration
└── package.json                        # Dependencies
```

---

## 3. Route-by-Route Implementation Status

| Route | Render Type | Data Source | Functional | Notes |
|---|---|---|---|---|
| `/` | RSC | Static (hardcoded) | Yes | All sections render; banner images 404 |
| `/coupons` | RSC | Hardcoded in-file | Yes | 12 items; links to `/coupons/[slug]` → 404 |
| `/offers` | RSC | Hardcoded in-file | Yes | 9 items; links to `/offers/[slug]` → 404 |
| `/blog` | RSC | Hardcoded in-file | Yes | 6 posts; links to `/blog/[slug]` → 404 |
| `/categories` | Client | `data/categoriesData.ts` | Yes | Static but interactive |
| `/stores` | Client | Axios → broken API | **No** | Empty grid; `useStores()` returns undefined |
| `/stores/[brandId]` | RSC | `data/brands.ts` | **Partial** | Amazon + Walmart only |
| `/sign-in` | Client | AuthForm | Partial | OAuth works (needs env vars); email fake |
| `/sign-up` | Client | AuthForm | Partial | Same as sign-in |
| `/dashboard` | RSC | `auth()` session | Partial | Shows session data; no user features |
| `/dashboard/*` | — | — | **No** | No sub-routes exist |
| `/blog/[slug]` | — | — | **No** | Route does not exist |
| `/coupons/[slug]` | — | — | **No** | Route does not exist |
| `/offers/[slug]` | — | — | **No** | Route does not exist |
| `/categories/[slug]` | — | — | **No** | Route does not exist |
| `/api/*` | — | — | **No** | Only `/api/auth/[...nextauth]` exists |

---

## 4. Data Model Relationships

```
User (NextAuth)
 ├── Account[] (OAuth providers)      [onDelete: Cascade]
 └── Session[] (JWT sessions)         [onDelete: Cascade]

Store (core business entity)
 ├── StoreCoupon[]                    [onDelete: Cascade]
 │     └── fields: code, title, brandName, brandLogo (Json),
 │                 slug, date, description, savings, minimumPurchase,
 │                 verified, exclusive, terms, expires, usedCount
 ├── FeaturedArticle[]                [onDelete: Cascade]
 │     └── fields: title, description, author
 ├── FAQ[]                            [onDelete: Cascade]
 │     └── fields: question, answer
 ├── Category[]                       [onDelete: Cascade]
 │     └── fields: title (@unique — see schema issue below)
 ├── Stats (1:1)                      [onDelete: Cascade]
 │     └── fields: totalOffers, couponCodes, inStoreCoupons, freeShippingDeals
 └── ContentWriter (1:1)              [onDelete: Cascade]
       └── fields: name, role, bio

MISSING RELATIONSHIPS (not in current schema):
 - User ↔ StoreCoupon   → saved/favorite coupons
 - User ↔ Store         → favorite stores
 - User ↔ Newsletter    → subscription record
 - CouponClick          → affiliate click tracking model
 - Standalone Blog Post → FeaturedArticle is store-scoped, not standalone
 - Global Category      → Category is store-scoped, not a top-level taxonomy
```

### Schema Issues

| Issue | Location in schema.prisma | Impact |
|---|---|---|
| `updatedAT` (capital T) — should be `updatedAt` | Lines for Store, Stats, ContentWriter, FeaturedArticle, StoreCoupon, FAQ, Category | Prisma generates column `updatedAT`; app code using `updatedAt` gets `undefined` at runtime |
| `brandLogo` typed as `Json?` in StoreCoupon | StoreCoupon model | Inconsistent with `string` type in TypeScript data files; causes serialization edge cases |
| `Category.title` is globally `@unique` | Category model | Two stores cannot share the same category title (e.g. two stores both tagged "Electronics" will throw a unique constraint violation) |

---

## 5. Authentication Flow

### 5.1 Current Flow

```
OAuth (Google / GitHub):
  User → /sign-in → clicks "Continue with Google"
    → next-auth/react signIn("google", { redirectTo: "/dashboard" })
    → NextAuth v5 handles OAuth callback at /api/auth/[...nextauth]
    → PrismaAdapter stores User + Account in PostgreSQL
    → JWT session created (strategy: "jwt")
    → User redirected to /dashboard
    → DashboardLayout: const session = await auth() → session exists → renders ✅

Email/Password:
  User → /sign-in → enters email/password → submits
    → AuthForm.onSubmit → 1-second delay → "Login successful!" toast ❌
    → No session created
    → No NextAuth CredentialsProvider configured
    → User is NOT authenticated despite seeing the success toast
```

### 5.2 Middleware Behavior

```typescript
// middleware.ts — current state
export const { auth: middleware } = NextAuth(authConfig)
// No config export with matcher patterns
```

The middleware is exported but has no `matcher` config. This means:
- Middleware runs on **every request** including static assets (wasteful)
- `/dashboard` is **not protected at middleware level**
- Protection happens only in `app/dashboard/layout.tsx` via `auth()` call (fragile — any new dashboard page added without this check would be unprotected)

### 5.3 Steps to Complete Authentication

```
1. Add CredentialsProvider to auth.config.ts:
   - authorize() → prisma.user.findUnique → bcrypt.compare password

2. Add `password String?` field to User model in schema.prisma
   - Nullable so OAuth-only users are not required to have a password

3. Create app/api/auth/register/route.ts:
   - Validate email + password
   - Hash password with bcrypt
   - prisma.user.create(...)
   - Return session or redirect to sign-in

4. Update AuthForm.onSubmit:
   - Call register API (sign-up mode)
   - Call signIn("credentials", ...) (sign-in mode)

5. Add matcher config to middleware.ts:
   export const config = {
     matcher: ['/dashboard/:path*', '/api/protected/:path*']
   }

6. Set environment variables:
   AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET,
   AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, DATABASE_URL
```

---

## 6. Data Fetching Patterns

### Pattern A — Static Hardcoded Imports (Working)

Used by: All homepage sections, `/coupons`, `/offers`, `/blog`, `/categories`, `/stores/[amazon|walmart]`

```typescript
// Example: top-coupons.tsx
import { coupons } from "@/data/coupons";
// Direct import — no network call, always works, never updates
```

**Problems:** Data is frozen at build time. Cannot be updated without a code deployment. No pagination, real-time filtering, or expiry validation.

### Pattern B — React Query + Axios (Broken)

Used by: `/stores` page only

```typescript
// hooks/use-stores.tsx
export const useStores = () => useQuery({
  queryKey: ['all-stores'],
  queryFn: fetchAllStores,
});

// lib/api/store.ts
export const fetchAllStores = async () => {
  const res = await api.get("/stores");  // baseURL is undefined
  return res.data;
}

// lib/axios.ts
const baseURL = typeof window === 'undefined'
  ? process.env.BACKEND_URL            // undefined in all environments
  : process.env.NEXT_PUBLIC_BACKEND_URL; // undefined in all environments
```

**Root cause:** Neither env var is defined. When `baseURL` is `undefined`, Axios sends `GET /stores` relative to the current origin. In dev this hits `http://localhost:3000/stores`, which returns the Next.js HTML page, not JSON. React Query receives HTML, tries to parse it as a Store array, and returns `undefined`.

### Pattern C — Server-Side Auth Check (Working)

Used by: `/dashboard/layout.tsx`

```typescript
const session = await auth();
if (!session) return <NotAuthenticatedPage />;
```

Correct Next.js 15 pattern. Works when OAuth env vars are configured.

### Pattern D — No Pattern (Missing)

- No Next.js API routes exist (except `/api/auth/[...nextauth]`)
- No Server Actions implemented
- No Prisma queries from page/layout components (despite Prisma client being imported)

---

## 7. Component Dependency Tree

```
app/layout.tsx
└── ThemeProvider
    └── LanguageProvider
        └── ReactQueryProvider
            └── (all page routes)

app/(public)/layout.tsx
├── Header
│   ├── NavigationMenu (shadcn)
│   ├── Sheet (shadcn — mobile drawer nav)
│   ├── ThemeToggle → ThemeProvider context
│   ├── LanguageToggle → LanguageProvider context
│   └── Link → /sign-in
└── Footer
    └── useLanguage() → LanguageProvider context

app/(public)/page.tsx (Homepage)
├── BannerSlider → useLanguage()
├── LogoCloud (self-contained)
├── TopCoupons → CouponCard → useToast()     [BUG-001: wrong Button/Link imports]
├── BrandSection → useLanguage()
├── TrendingCategories → CouponCard + useLanguage()
├── PopularOffers → useToast() + useLanguage()
├── TopShops → useLanguage()
└── PaymentOptionsWithRealLogos (self-contained)

app/(public)/stores/page.tsx
└── useStores() → useQuery() → fetchAllStores() → axios → BROKEN

app/(public)/stores/[brandId]/page.tsx
└── BrandPageClient (all UI inline, ~430 lines)

app/(auth)/sign-in & sign-up
└── AuthForm
    ├── react-hook-form + Zod
    ├── GoogleAuthButton → signIn("google")
    ├── GithubAuthButton → signIn("github")
    ├── FormError
    └── FormSuccess

app/dashboard/layout.tsx
├── auth() (NextAuth server-side)
├── Sidebar (collapsible, 3 unlinked nav buttons)
├── Dashboard/Header
└── Dashboard/Footer
```

---

## 8. Known Bugs

### BUG-001 — Critical: Wrong Imports in `top-coupons.tsx`

**File:** `components/top-coupons.tsx`
**Issue:** `Button` is imported from `"react-day-picker"` (not a UI button). `Link` is imported from `"lucide-react"` (an icon component, not Next.js Link).
**Impact:** Latent runtime bug; currently suppressed because neither import is actually used in JSX. Will break visibly if either is called.

### BUG-002 — Critical: Axios `baseURL` Not Configured

**File:** `lib/axios.ts`
**Issue:** `BACKEND_URL` and `NEXT_PUBLIC_BACKEND_URL` are not set in any environment.
**Impact:** `/stores` page shows an empty grid. `useStores()` silently returns undefined for all users.

### BUG-003 — Critical: Prisma Field Typo `updatedAT`

**File:** `prisma/schema.prisma` (7 models)
**Issue:** `updatedAT DateTime @updatedAt` — capital T in field name.
**Impact:** Prisma generates a DB column named `updatedAT`. Application code using `record.updatedAt` (camelCase) gets `undefined`. TypeScript errors are suppressed by `ignoreBuildErrors: true` in `next.config.mjs`.

### BUG-004 — High: Email/Password Auth is a Fake

**File:** `components/auth/AuthForm.tsx`
**Issue:** `onSubmit` does `await new Promise(res => setTimeout(res, 1000))` then shows a success toast.
**Impact:** Users believe they are authenticated but no session is created. Navigating to `/dashboard` shows the "Not Authenticated" page.

### BUG-005 — High: Middleware Has No Route Matcher

**File:** `middleware.ts`
**Issue:** No `config` export with `matcher` patterns.
**Impact:** Middleware runs on all requests (including `/_next/static`). Dashboard routes are not protected at the middleware layer — only at the layout level. Any new dashboard page added without an `auth()` check would be publicly accessible.

### BUG-006 — Medium: `Category.title` Has a Global Unique Constraint

**File:** `prisma/schema.prisma`, Category model
**Issue:** `title String @unique`
**Impact:** Two different stores cannot be tagged with the same category name. Inserting a second "Electronics" category for a different store throws a Prisma unique constraint violation. Should be `@@unique([title, storeId])`.

### BUG-007 — Medium: Hardcoded "RetailMeNot" Competitor Copy

**File:** `app/(public)/stores/[brandId]/client.tsx`
**Issue:** Store detail page contains copy reading "RetailMeNot.com has a dedicated merchandising team..."
**Impact:** Users see competitor branding. Damages trust and harms SEO.

### BUG-008 — Medium: All 10 Coupons Share the Same Logo

**File:** `data/coupons.ts`
**Issue:** All coupon entries import and use `totalWineImage` as their `brandLogo`.
**Impact:** Every CouponCard on the home page shows the Total Wine logo regardless of the brand.

### BUG-009 — Low: Banner Images 404

**File:** `components/banner-slider.tsx`
**Issue:** Paths `/images/electronics.jpg`, `/images/fashion.jpg`, `/images/travel.jpg` do not exist in `/public/images/`.
**Impact:** Homepage hero carousel renders with broken images. The dark overlay partially conceals the breakage but it is visible.

### BUG-010 — Low: TypeScript and ESLint Disabled in Build

**File:** `next.config.mjs`
**Issue:** `typescript.ignoreBuildErrors: true`, `eslint.ignoreDuringBuilds: true`
**Impact:** BUG-001, BUG-003, and other type violations are silently ignored. The build always succeeds regardless of errors. Technical debt accumulates invisibly.

### BUG-011 — Low: Component Export Name Mismatch

**File:** `components/brand-section.tsx`
**Issue:** `export default function StoreSection()` but the import in `page.tsx` calls it `BrandSection`.
**Impact:** Works because of default export, but creates confusion when searching the codebase.

### BUG-012 — Low: All 12 Brand Logos Are the Same Image

**File:** `components/brand-section.tsx`
**Issue:** All 12 brand entries import `brandLogo from "@/public/images/webp/brandLogo.avif"`.
**Impact:** The brands grid on the homepage shows the same image for every brand.

---

## 9. Security Considerations

| Risk | Severity | Location | Notes |
|---|---|---|---|
| No middleware route protection | High | `middleware.ts` | Dashboard protected only by layout check; fragile |
| `AUTH_SECRET` may not be set | High | `auth.ts` | NextAuth requires this; absent = insecure sessions |
| No rate limiting on auth routes | High | N/A | Brute force possible on OAuth initiation |
| TypeScript/ESLint disabled in build | Medium | `next.config.mjs` | Masks type safety violations including potential security bugs |
| No CSRF protection on newsletter form | Medium | `components/footer.tsx` | Currently a no-op; when implemented, needs CSRF token |
| `withCredentials: true` on axios | Low | `lib/axios.ts` | Sends cookies cross-origin to external API; may expose auth tokens |
| `images.unoptimized: true` | Low | `next.config.mjs` | Performance concern; not a direct security risk |
| Email/password auth has no backend | Critical (future) | `components/auth/AuthForm.tsx` | When CredentialsProvider is added, passwords MUST be hashed with bcrypt; plaintext storage would be critical |
| Prior-project assets in `/public` | Low | `public/images/png/youtube-pfp/` | Possible IP / content ownership issue |

---

## 10. Performance Considerations

| Area | Issue | Recommendation |
|---|---|---|
| Image optimization disabled | `unoptimized: true` in next.config.mjs | Enable Next.js image optimization for production; remove this flag |
| Bundle size | 40+ shadcn/ui components installed (many unused) | Audit and remove unused components; tree-shaking handles imports but installed packages add to install time |
| Framer Motion on animated pages | Large library imported broadly | Use `dynamic(() => import('framer-motion'), { ssr: false })` for animation-heavy client components |
| Static data at build time | All homepage data is compile-time imports | Acceptable now; migrate to ISR (`export const revalidate = 3600`) when API is connected |
| React Query cache configuration | Default staleTime (0) means refetch on every mount | Set `staleTime: 5 * 60 * 1000` for store data to avoid redundant requests |
| Homepage Suspense boundaries | 8 Suspense boundaries on home page | Good streaming pattern; consider adding `loading.tsx` to all public routes |
| No pagination | All listing pages return all items | Implement cursor-based pagination; fine at 10 items, catastrophic at 10,000 |
| LanguageProvider re-renders | Full tree re-render on language change | Wrap translation object with `useMemo`; consider migrating to `next-intl` |
| Middleware runs on all routes | No matcher config | Add matcher to exclude `/_next/static`, `/favicon.ico`, `/images/*` |
