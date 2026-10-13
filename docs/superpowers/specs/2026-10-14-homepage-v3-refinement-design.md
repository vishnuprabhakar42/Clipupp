# Homepage v3 refinement pass: design

Date: 2026-10-14. Branch: New-design-v1 (on top of 65c2add). App: frontend/clipupp only.
Source: Vishnu asked for every refinement from the suggestion list of 2026-10-14 to be done ("fix all of these fixes").

## Scope

In scope (frontend only, no backend changes):
1. Performance: fonts trimmed to the weights in use with `display: "optional"` for the display face, closed-by-default client islands lazy-loaded, client message catalogue limited to the namespaces client components use, preconnect to the R2 logo host, blur placeholders on deal and spotlight images, Lighthouse budgets enforced in CI.
2. Responsiveness: an `md` (768px) breakpoint across every rail and grid, fluid display type with `clamp()`, a 1320px cap at `2xl`, chip rows with edge fades and scroll padding, one phone spacing scale, a 320px and a 1024px capture added to the verification set.
3. UX: Today state in the URL (`tab`, `sort`, `store`) with scroll restore, search match highlighting, clearable recent searches, a no-results state, "coming soon" tiles for deals, bank and calendar when production has no rows, a sticky "Copied, open {Store}" bar on phones after a reveal, a "Report not working" reason row in the coupon sheet (stored locally until the feedback API ships), the store tile "best" line on every breakpoint.
4. Visual: hero background gradient and grain, 1px top highlight on cards, press scale on buttons and chips, sliding tab underline, tinted circle category icons, spotlight text clamped to 3 lines, dark-mode halo fix on deal images.
5. Quality gates: a committed Playwright suite (`tests/e2e/home.spec.ts`) with axe, 1440/390 captures and the copy check, wired into frontend CI; Lighthouse CI assertions (LCP 2.5s mobile, CLS 0.05, total JS 170 KB).
6. SEO: `BreadcrumbList` on the homepage, `Offer` schema on every deal card, hreflang pair asserted by test.

Out of scope (backend phase): success-rate badge, verifier identity, live "copied N times" counters, "N shoppers saved today", bank card selector that filters coupons (coupons carry no bank today), guest saves outside the feed, the feedback POST.

Not done because already true: next/link prefetches in-viewport links in production; `/hi` is pre-rendered via `generateStaticParams`; hreflang alternates exist in the locale layout (only asserted now).

## Constraints (verbatim from the v3 spec)

No em dash anywhere (plain dash). Copy never says "cashback" or "WhatsApp". Brand stays `#8529CD`; brand fills use `text-clipupp-primary-fg`. Motion only transform/opacity/translate; never pin `transform` with animation-fill-mode on hoverable elements. Server components by default, client leaves only. en and hi key sets identical. Tailwind breakpoints `sm` 640, `md` 768 (new), `lg` 1024, `2xl` 1400 (existing). Never edit committed migrations. No new runtime dependencies except `@axe-core/playwright` and `@lhci/cli` as dev dependencies.

## Needs from Vishnu (not blocking)

Wordmark SVG matching the design width, Meesho and Apollo Pharmacy logos, Telegram bot username.
