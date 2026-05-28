# PERF-RULES.md

Rules that every change to this frontend has to respect. They're the codification of the user's two non-negotiable priorities: **page load speed** and **technical SEO**.

If your change can't meet these, flag it on the PR and propose an alternative — don't silently regress.

---

## 1. Lighthouse score budgets (gate every PR)

| Category | Mobile | Desktop |
|---|---|---|
| Performance | ≥ 95 | ≥ 98 |
| SEO | 100 | 100 |
| Accessibility | ≥ 95 | ≥ 95 |
| Best Practices | ≥ 95 | ≥ 95 |

Enforced in CI via `.lighthouserc.json` + `.github/workflows/lighthouse-ci.yml`. Run locally with `npm run lhci`.

## 2. Default to server components

- `"use client"` requires a written reason in the file (event handlers, refs, browser-only APIs, state that survives across renders).
- If the data is already in a server-fetched payload, the consumer MUST be a server component. Don't re-fetch via `useQuery` what the parent already has.
- When interactivity is needed in only a corner of a server component, extract that corner into a small client island (`features/.../*Client.tsx`) and pass props down.

The Phase 1 home-rails conversion (9 of 16 client components → server) cut the homepage first-load JS from 151 KB → 141 KB by following this rule. The Header split (Phase 1) added another ~10 KB savings.

## 3. No new client-side dependencies without measurement

Before adding a heavy lib to a public route, run `npm run analyze` and confirm it's worth the bytes.

Currently-tolerated heavy libs:
- `react-markdown` + `remark-gfm` — used by blog post route and legal pages (already loaded; reuse via `MarkdownView`).
- `embla-carousel-react` — used by `PromoBannersCarousel` (sliding hero). Confirmed worth it for the auto-rotate UX.
- `recharts`, `@dnd-kit/*` — admin-only. Stay behind `dynamic({ ssr: false })` in admin layouts; never on public routes.
- `framer-motion` — minimal usage; if you find yourself reaching for it for a single CSS-doable animation, prefer pure CSS.

## 4. `generateStaticParams` on every `[slug]` route

Google's crawler should never hit a cache-miss for an indexed URL. Currently wired:

- `/stores/[slug]` — top 100 by popularity × 2 locales
- `/coupons/[slug]` — top 200 by popularity × 2 locales
- `/categories/[slug]` — every category × 2 locales
- `/blog/[slug]` — every published article × 2 locales

URLs outside the pre-rendered set still work — ISR generates them on first request. Don't skip `generateStaticParams` because "ISR handles it" — the warm-cache cost is real on the first crawl of every new URL.

## 5. JSON-LD on every indexed page

Use the builders in `lib/seo/schemas/` and the `<JsonLd>` renderer.

| Page type | Required schemas |
|---|---|
| Root layout (everywhere) | `WebSite`, `Organization` |
| Home | + `HowTo` (HowItWorksSection) |
| Store detail | `Store` (+ AggregateRating), `FAQPage`, `BreadcrumbList` |
| Coupon detail | `Offer`, `Product`, `Brand`, `BreadcrumbList` |
| Category detail | `CollectionPage`, `ItemList`, `BreadcrumbList` |
| List pages | `ItemList` |
| Blog post | `Article`, `BreadcrumbList` |

Validate with [Google Rich Results Test](https://search.google.com/test/rich-results) before shipping a new schema.

## 6. Metadata on every page via `buildMetadata`

Use `lib/seo/meta.ts:buildMetadata({...})` — it returns canonical + hreflang + openGraph + twitter + robots + alternateLocale + og:locale in one go.

Never hardcode `<head>` tags inline in a page; never duplicate the canonical-construction logic.

For pages that should not be indexed (`/search` results, account pages, auth pages), pass `noindex: true`. For auth pages keep `followWhenNoindex: true` so crawlers can still walk outbound links.

## 7. CLS = 0 always

- Every `<Image>` lives inside a fixed-aspect parent (`aspect-video`, `aspect-[5/3]`, or `h-N w-N` explicit dimensions).
- Skeleton dimensions match the final element's dimensions exactly.
- Hero images get `priority + fetchPriority="high"`; below-the-fold images are lazy (Next.js default).
- Never render an `<Image>` with `fill` against a container that doesn't have `position: relative` and explicit dimensions.

## 8. No webfonts

The system font stack (`--font-sans` in `globals.css`) is intentional. Adding even one display webfont costs 30–90 KB and 100–400 ms LCP delay even with `font-display: swap`.

Visual differentiation comes from weight contrast and the `.clipupp-display-hero` rule (3.5 rem / 1.05 / −0.025em / 700) — not from a new family.

## 9. Lazy-load anything not above-the-fold

Modals, banners, reporters, third-party scripts — wrap in `dynamic({ ssr: false, loading: () => null })`. See `components/site/DeferredClientWidgets.tsx` for the canonical pattern (CookieBanner, FirstVisitModal, WebVitalsReporter).

## 10. ReactQueryProvider stays out of the root layout

It lives in `(authed)` and `(admin)` route group layouts only (Phase 1 final state). Public pages get React Query only if a client component subscribes directly — and even then, prefer pushing the data into server props instead.

Currently two components on public pages still pull `useQuery`: `StoreFilters`, `CouponFilters`. They live on `/stores` and `/coupons` respectively. The migration plan: rewrite both to use URL state (searchParams) + server filtering. Until that's done, React Query is in the root layout.

## 11. Image rules

- Use `next/image` everywhere — never raw `<img>` (the OG image routes at `app/og/{store,coupon}/[slug]/route.tsx` are the documented edge-runtime exception).
- White-tile container for store logos with `object-contain` — never `object-cover` on a logo.
- `placeholder="blur"` whenever a server-side blur placeholder is available; otherwise leave it off (don't add `placeholder="empty"`; that's the default).
- New image domains go in `next.config.mjs:images.remotePatterns` BEFORE you reference them.

## 12. Color rules (Clean Blue palette)

| Role | When to use | Forbidden |
|---|---|---|
| `clipupp-primary` (#3B82F6) | Trust, CTAs, links, savings numbers | — |
| `clipupp-accent` (#F97316) | Urgency / savings (Flash deals, expiring badges, "Hot deals" pill) — max ONE per fold | Chrome, primary CTAs, category tiles, hover states, link colors |
| `clipupp-success` (#10b981) | Verified pills, "Live", "Active code" | CTAs |
| `clipupp-danger` (#DC2626) | Errors, "Expired" pill | Chrome |
| `clipupp-neutral-{50..900}` | Everything else | — |

All marketing %-saved numbers stay primary blue. The eye expects "savings = trust = blue" on couponing sites (Rakuten, RetailMeNot, Honey all follow this).

## 13. Density rule

- **Scan-dense** — store-detail coupon list, search results, `/coupons` list, account tables. ("I'm here to find something specific.")
- **Spacious** — homepage hero, category landing, blog. ("I'm browsing/exploring.")

## 14. Security headers

`next.config.mjs:headers()` emits:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()`
- `Content-Security-Policy-Report-Only: <permissive policy>` — promote to enforce after 2 weeks of telemetry

The `/r/{couponId}` affiliate redirects also get `X-Robots-Tag: noindex, nofollow` and `X-Frame-Options: DENY`.

## 15. Caching

Backend (`HttpCachingConfig.java` + per-controller `CacheControl`):
- Detail endpoints: 60 s + SWR 5 m
- List endpoints: 30 s + SWR 2 m
- Tree / settings / sitemap: 5 m + SWR 30 m
- Affiliate redirects (`/r/`): `no-store`
- Spring Security default Cache-Control is overridden (`SecurityConfig.java`) so controller headers actually reach clients

Frontend ISR:
- `/` static (no `revalidate`)
- `/stores`, `/coupons`, `/offers`: `revalidate = 30`
- `/stores/[slug]`, `/coupons/[slug]`: `revalidate = 60`
- `/categories/[slug]`: `revalidate = 60`
- `/blog/[slug]`: `revalidate = 600`

## 16. Phase 1 = coupons only (Phase 1 scope constraint)

User-facing copy: "deals" / "coupons" / "save". **Never** "cashback". The `cashbackRate` field on `store` still exists (DB schema), but it's repurposed as a generic deal-label string. Cashback is a Phase 2 feature.

## How to run the audits locally

```bash
# Bundle visualizer
npm run analyze
# Reports land in .next/analyze/ — open client.html in a browser

# Lighthouse CI (needs the prod build first)
npm run build
npm run lhci
# Runs three iterations per URL; fails if any budget regresses

# Type + lint + build smoke
npm run typecheck
npm run lint
npm run build
```
