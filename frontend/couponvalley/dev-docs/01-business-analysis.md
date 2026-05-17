# CouponValley — Business Analysis

**Document Version:** 1.0
**Date:** 2026-05-09
**Status:** Internal Working Document
**Audience:** Founders, Product Managers, Developers

---

## 1. Product Vision and Positioning

### 1.1 Mission Statement

CouponValley is a coupon and cashback aggregation platform designed to help shoppers discover, compare, and use discount codes, deals, and promotional offers from hundreds of retailers — in one place.

### 1.2 Competitive Landscape

| Dimension | RetailMeNot | CouponDunia | Rakuten | **CouponValley (Current)** |
|---|---|---|---|---|
| Market | US | India | Global | Unclear (copy references both USD and INR) |
| Core Model | Affiliate + Ads | Affiliate | Cashback | Affiliate (planned) |
| Store Coverage | 50,000+ | 3,000+ | 3,500+ | 2 (hardcoded) |
| User Accounts | Yes | Yes | Yes | Partial (OAuth only) |
| Admin Panel | Yes | Yes | Yes | None |
| Mobile App | Yes | Yes | Yes | No |
| Newsletter | Yes | Yes | Yes | UI only, no-op |
| Content/Blog | Yes | Yes | No | UI only (hardcoded) |
| Cashback | No | No | Yes | Not implemented |
| i18n | No | No | Partial | Yes (EN/ES/FR/AR) |
| RTL Support | No | No | No | Yes (Arabic) |

**Positioning opportunity:** CouponValley is uniquely positioned to target multilingual markets (South Asia, MENA, Latin America) that RetailMeNot ignores, with native Arabic/RTL support already in the codebase. This differentiation is not yet articulated in the product copy, which still reads "RetailMeNot" in the store detail pages (see `app/(public)/stores/[brandId]/client.tsx`).

> **Action Required:** Replace all RetailMeNot brand references with CouponValley throughout the UI.

---

## 2. User Personas

### Persona 1 — The Casual Bargain Hunter

- **Name:** Priya, 28, marketing professional
- **Goal:** Save money on fashion and electronics without spending time hunting
- **Behavior:** Searches Google for "[brand] coupon code," lands on aggregator, copies code, leaves
- **Pain Points:** Expired codes, fake codes, too many clicks to get the code
- **CouponValley touchpoints:** Home page → TopCoupons / BrandSection → CouponCard reveal/copy
- **Current support:** Good UI, but all coupon data is hardcoded and static

### Persona 2 — The Loyal Saver

- **Name:** Marcus, 35, teacher
- **Goal:** Save on regular monthly purchases; wants to track favorite stores
- **Behavior:** Signs up, saves favorite stores, checks back weekly, subscribes to newsletter
- **Pain Points:** Has to re-search for stores he already uses
- **CouponValley touchpoints:** Sign-up → Dashboard → Saved Coupons → Newsletter
- **Current support:** Auth framework exists; saved coupons, newsletter, and dashboard content are not implemented

### Persona 3 — The Deal Researcher

- **Name:** Ayan, 42, IT manager
- **Goal:** Compares multiple stores before a large purchase; reads blog content for tips
- **Behavior:** Visits /stores, filters by category, reads store detail pages, reads blog
- **Pain Points:** Wants reliable, accurate coupon data; distrusts unverified codes
- **CouponValley touchpoints:** /stores → /stores/[brandId] → /blog → /categories
- **Current support:** /stores is wired to a broken API (no baseURL); store detail only works for Amazon/Walmart; blog articles link to `/blog/[slug]` which does not exist

### Persona 4 — The Retailer / Brand Partner (B2B)

- **Name:** Sales team at a mid-size e-commerce brand
- **Goal:** List their store, upload coupons, pay for featured placement
- **Behavior:** Needs an admin interface or API to manage their brand page and coupon inventory
- **CouponValley touchpoints:** Admin panel (non-existent)
- **Current support:** None — no admin panel, no store submission form, no B2B contact flow

---

## 3. User Journey Maps

### Journey A — Anonymous Coupon Discovery (Most Common Flow)

```
Step 1: User lands on homepage (/)
        ↓
        Sees: BannerSlider [3 hardcoded banners → images 404]
              LogoCloud [static brand icons]
              TopCoupons [10 hardcoded coupons from data/coupons.ts]
              BrandSection [12 hardcoded brands, all same logo]
              TrendingCategories [6 categories, filters coupons locally]
              PopularOffers [6 hardcoded offers, tab-filtered]
              TopShops [8 hardcoded shops]
              PaymentOptionsWithRealLogos

Step 2: User clicks a store in TopShops or BrandSection
        ↓
        If Amazon or Walmart → /stores/amazon or /stores/walmart
          → Loads BrandPageClient with full hardcoded data ✅
        If any other store → notFound() → 404 ❌

Step 3: User is on store detail page, clicks "Show Coupon"
        ↓
        Button is non-functional (no onClick handler in client.tsx) ❌

Step 4: User clicks "Click to reveal code" on CouponCard (home page)
        ↓
        Works: toggles revealed state, shows code string ✅
        "Copy" button: copies to clipboard, shows toast ✅
        But code is a raw data string (e.g. "SUMMER25"), not an affiliate link ❌
        No click is tracked, no revenue is generated ❌
```

### Journey B — Store Browse (Broken Today)

```
Step 1: User clicks "Top Stores" in nav → /stores
        ↓
        Page mounts, useStores() fires
        → axios.get("/stores") → baseURL is undefined → request fails silently
        → isLoading briefly true, then data = undefined
        → filteredStores = [] → empty grid renders ❌

Step 2: User sees empty page with no stores
        ↓
        No error message displayed (silent failure)
        User bounces ❌
```

### Journey C — Authentication

```
Step 1: User clicks "Sign In" in header → /sign-in
        ↓
Step 2a: User enters email + password → submits
         ↓
         AuthForm.onSubmit: 1-second fake delay → "Login successful!" toast ❌
         No session created. Navigating to /dashboard shows "Not Authenticated" ❌

Step 2b: User clicks "Continue with Google"
         ↓
         signIn("google", { redirectTo: "/dashboard" }) fires
         → If AUTH_GOOGLE_ID/SECRET env vars are set → OAuth flow → works ✅
         → If not set → OAuth error page ❌

Step 3: User lands on /dashboard (if OAuth succeeded)
        ↓
        DashboardLayout: auth() checks session → renders ✅
        Shows: UserAvatar with name, email, session expiry ✅
        Sidebar nav: Dashboard, Settings, Profile buttons → no routing ❌
        No saved coupons, no favorites, no account management ❌
```

### Journey D — Category Browse

```
Step 1: User clicks /categories
        ↓
        1-second fake loading state (setTimeout)
        Renders category sidebar + subcategory grid ✅
        All data from local categoriesData.ts (fully static, works) ✅
        But subcategory cards show "4.5 ★ • 100+ deals" for all — hardcoded ❌

Step 2: User clicks a subcategory card
        ↓
        No navigation — cards are not links ❌
        No filtered coupon list appears ❌
```

---

## 4. Component-to-Business-Function Mapping

| Component | File | Business Function | Status |
|---|---|---|---|
| BannerSlider | `components/banner-slider.tsx` | Hero promotions, featured retailer ads | Renders; banner images 404 |
| LogoCloud | `components/LogoCloud/LogoCloud.tsx` | Social proof / brand recognition | Static, works |
| TopCoupons | `components/top-coupons.tsx` | Primary deal discovery on home | Works (10 hardcoded items) |
| CouponCard | `components/CouponCard.tsx` | Coupon reveal + copy-to-clipboard | Works; no affiliate redirect |
| BrandSection | `components/brand-section.tsx` | Store discovery from home | Works visually; all stores use same logo |
| TrendingCategories | `components/trending-categories.tsx` | Category-based deal discovery | Works with local data |
| PopularOffers | `components/popular-offers.tsx` | Tabbed offer showcase | Works with local data |
| TopShops | `components/top-shops.tsx` | Store quick-links | Works; most store links → 404 |
| PaymentOptionsWithRealLogos | `components/PaymentOptionsWithRealLogos.tsx` | Payment trust signals | Renders |
| Header | `components/header.tsx` | Global navigation + search | Nav works; search is console.log |
| Footer | `components/footer.tsx` | Newsletter capture + quick links | Newsletter is console.log |
| AuthForm | `components/auth/AuthForm.tsx` | Email/password sign-in and sign-up | UI works; submit is fake |
| GoogleAuthButton | `components/auth/GoogleAuthButton.tsx` | OAuth sign-in (Google) | Wired to NextAuth; needs env vars |
| GithubAuthButton | `components/auth/GithubAuthButton.tsx` | OAuth sign-in (GitHub) | Wired to NextAuth; needs env vars |
| Dashboard Sidebar | `components/dashboard/Sidebar.tsx` | User account navigation | Nav items are unlinked buttons |
| Store listing | `app/(public)/stores/page.tsx` | Store catalog with search/filter | Blank — axios baseURL missing |
| Store detail | `app/(public)/stores/[brandId]/page.tsx` | Store page with coupons | Only Amazon + Walmart work |
| Coupons page | `app/(public)/coupons/page.tsx` | Full coupon catalog | 12 hardcoded items, no pagination |
| Offers page | `app/(public)/offers/page.tsx` | Best offers listing | 9 hardcoded items |
| Blog | `app/(public)/blog/page.tsx` | Content marketing / SEO | 6 hardcoded posts; slug links → 404 |
| Categories | `app/(public)/categories/page.tsx` | Category browser | Static but functional |

---

## 5. Monetization Model

### 5.1 Current State

**No monetization is active.** The infrastructure for the primary revenue model (affiliate click-through) is partially in place — store detail pages have "Show Coupon" buttons — but those buttons have no affiliate link logic and no click tracking.

### 5.2 Planned Revenue Streams

| Revenue Stream | Business Mechanism | Technical Requirement | Status |
|---|---|---|---|
| **Affiliate Commissions** | User clicks "Get Code" → redirected through affiliate URL → purchase tracked | Affiliate URL per coupon, redirect tracking, conversion pixel | Not implemented |
| **Featured Store Placements** | Retailers pay for homepage banner slots or "Trending" badges | Admin panel, store tier system, billing integration | Not implemented |
| **Email Newsletter Ads** | Monetize subscriber list with sponsored deals | Working newsletter signup, ESP integration | Not implemented |
| **Premium Cashback (Future)** | CouponValley earns commission, passes % back to registered users | Cashback wallet, payment processor | Not designed |

### 5.3 Affiliate Revenue Flow (Required Design)

```
User action: Click "Get Code" on any coupon
    → POST /api/clicks { couponId, userId?, sessionId }
    → Server logs click (storeId, couponId, userId/session, timestamp, IP)
    → 302 redirect to affiliateUrl (stored per coupon in DB)
    → Affiliate URL appends tracking params (e.g. ?ref=couponvalley&src=coupon_X)
    → Retailer site loads with affiliate cookie set
    → Purchase tracked by retailer → commission earned by CouponValley
```

**None of this flow exists today.** The "Show Coupon" button in `client.tsx` has no `href` or `onClick` handler.

---

## 6. Feature Matrix

### Core Consumer Features

| Feature | UI Exists | Functional | DB Model | Missing For Launch |
|---|---|---|---|---|
| Browse coupons | Yes | Partial (static data) | Yes (StoreCoupon) | API connection, real data |
| Browse stores | Yes | No (API broken) | Yes (Store) | Fix axios baseURL or use Prisma directly |
| Store detail page | Yes | 2 stores only | Yes | Dynamic DB lookup |
| Search | Yes (header) | No (console.log) | N/A | Search API + PostgreSQL full-text |
| Category filter | Yes | Yes (static) | Yes (Category) | API connection |
| Coupon code reveal | Yes | Yes | N/A | Affiliate redirect on reveal |
| Copy code | Yes | Yes | N/A | Click tracking |
| Blog listing | Yes | Partial | Yes (FeaturedArticle) | Individual article pages |
| Individual blog article | No | No | Partial | Create `/blog/[slug]` route |
| Individual coupon page | No | No | Yes | Create `/coupons/[slug]` route |
| Newsletter signup | Yes (UI) | No (console.log) | N/A | API route + ESP integration |
| User registration (email) | Yes | No (fake) | Yes (User) | CredentialsProvider + bcrypt |
| OAuth login | Yes | Partial (env vars) | Yes | Verify env setup |
| User dashboard | Yes | Partial (session only) | Yes | Build all dashboard features |
| Saved/favorite coupons | No | No | No (missing) | User-Coupon join table + API |
| Coupon expiry tracking | Yes (display) | No | Yes (expires field) | Expiry validation logic |
| Verified badge | Yes (display) | Static | Yes (verified field) | Verification workflow |
| Affiliate click tracking | No | No | No (missing) | CouponClick model + redirect API |
| Admin panel | No | No | No | Full build required |
| SEO metadata per page | Partial | Partial | N/A | Dynamic metadata per route |
| Pagination | No | No | N/A | All listing pages |
| Sorting / filtering | Partial (stores) | No | N/A | Stores + coupons pages |
| RTL layout (Arabic) | Yes | Yes | N/A | Production testing |
| Dark mode | Yes | Yes | N/A | Stable |

---

## 7. Missing Business-Critical Features

Ordered by revenue/retention impact:

### P0 — Blocks All Revenue

**1. Affiliate Redirect System**
No coupon click generates any revenue. Every "Get Code" or "Show Coupon" button is either a console.log or entirely unlinked. An `/api/redirect` route with affiliate URL, click logging, and proper 302 redirect is the single most important missing piece.

**2. Store API Connection**
The `/stores` page — the primary SEO landing page for every brand — shows nothing because `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` environment variables are not configured. Without this, the majority of the site's indexed URLs return empty pages.

**3. Dynamic Store Detail Pages**
Only Amazon and Walmart have working store pages. Every other store link (from the header, footer, TopShops, BrandSection) results in a 404. This means 95%+ of potential affiliate traffic is immediately lost.

### P1 — Blocks User Retention

**4. Email/Password Authentication**
The credential sign-in form submits to a fake 1-second delay and shows a success message without creating a session. Users who attempt to register with email cannot actually create an account.

**5. Newsletter Subscription Backend**
The newsletter form in the footer calls `console.log`. No email is captured. This blocks one of the three planned revenue streams.

**6. User Saved Coupons / Favorites**
There is no mechanism for registered users to save coupons or stores. The database schema has no User↔Coupon relationship. The dashboard shows only session data. This is the primary reason for users to create accounts.

### P2 — Blocks Content Marketing / SEO

**7. Individual Blog Article Pages**
The blog lists 6 articles, each linking to `/blog/[slug]` — a route that does not exist. All blog internal links result in 404. Blog content is a primary SEO driver for coupon sites.

**8. Individual Coupon / Offer Pages**
`/coupons/[slug]` and `/offers/[slug]` are both linked throughout the UI but neither route exists. These are critical for deep-link SEO (e.g. "SUMMER25 coupon code" searches).

### P3 — Blocks Scalability

**9. Admin Panel**
No way for the team or brand partners to add stores, upload coupons, verify codes, or manage content without direct database access.

**10. Search Functionality**
The header search bar only logs to console. Search is the most-used feature on coupon aggregator sites; users who cannot find a specific store or coupon leave immediately.
