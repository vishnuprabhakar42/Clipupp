# Homepage v3 Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the shipped v3 homepage from "matches the design" to industry-grade on performance, responsiveness, UX, polish, quality gates and SEO, frontend only.

**Architecture:** Every change is local to `frontend/clipupp`. Performance work trims what the locale layout ships (fonts, messages, client islands). Responsiveness adds one Tailwind breakpoint and fluid type through tokens so components change class lists, not structure. UX state moves into the URL through one helper. Quality gates are committed Playwright and Lighthouse CI configs so regressions block PRs.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind 3.4, next-intl v4, zustand, Vitest, Playwright 1.60 (already in devDependencies), `@axe-core/playwright` and `@lhci/cli` (new dev deps).

**Spec:** `docs/superpowers/specs/2026-10-14-homepage-v3-refinement-design.md`

## Global Constraints

- No em dash anywhere in code, copy, comments or commit messages; plain dash only.
- Copy never says "cashback" or "WhatsApp".
- Brand stays `#8529CD`; brand fills use `text-clipupp-primary-fg`.
- Motion only transform/opacity/translate; never pin `transform` with animation-fill-mode on hoverable elements.
- Server components by default; `"use client"` only on leaves.
- `messages/en.json` and `messages/hi.json` key sets identical (`messages.test.ts` enforces); every new key gets a Hindi value.
- Breakpoints: `sm` 640, `md` 768 (added in Task 3), `lg` 1024, `2xl` 1400.
- No new runtime dependencies. Dev-only additions: `@axe-core/playwright`, `@lhci/cli`.
- Gates after every task from `frontend/clipupp`: `npm run typecheck && npm run lint && npm run test`.
- Commit messages: conventional, no co-author line.
- Never edit committed Flyway migrations (no backend changes in this plan at all).

## Review Focus

1. A client component uses a message namespace not in the client allowlist: `useTranslations` must throw in dev, and the Vitest in Task 2 scans client files so this cannot ship.
2. A tablet at 768 to 1023px: rails must show 3 columns, never a 1024 layout squeezed or a phone layout stretched (Task 3 Playwright at 820).
3. A shared Today URL with an unknown tab or sort value: must fall back to All / Most used, no crash (Task 5 test).
4. Production feed with no deals, bank or sales rows: the "coming soon" tiles render once each, anchors still resolve, bottom nav Deals goes to `/offers` (Task 7 test).
5. A reveal on a phone with the clipboard blocked: the sticky bar must still open the store link and must not claim "Copied" (Task 7 test).

---

### Task 1: Fonts, lazy islands, preconnect, blur placeholders

**Files:**
- Modify: `frontend/clipupp/app/[locale]/layout.tsx` (fonts, preconnect, provider imports)
- Modify: `frontend/clipupp/app/[locale]/(public)/layout.tsx` (CategoriesMenu, SavedSheet mounting points if present there; check `components/site/BottomNavClient.tsx`)
- Create: `frontend/clipupp/components/site/lazy.ts`
- Modify: `frontend/clipupp/features/catalog/components/CouponSheet.tsx` (export default for dynamic import), `features/home/components/SavedSheet.tsx`, `components/site/CategoriesMenu.tsx`, `features/home/components/SpotlightCarousel.tsx` (no lazy: it is above the fold; add `placeholder="blur"` with a tiny data URL), `features/home/components/DealImage.tsx`
- Modify: `frontend/clipupp/next.config.mjs` (headers for `/api/v1/homepage` rewrite are backend-owned; instead add `Cache-Control` for `/_next/static` is default; nothing to do here, skip)
- Test: `frontend/clipupp/lib/img/blur.test.ts`

**Interfaces:**
- Produces: `components/site/lazy.ts` exporting `LazyCouponSheet`, `LazySavedSheet`, `LazyCategoriesMenuPanel` via `next/dynamic` with `ssr: false` and `loading: () => null`; `lib/img/blur.ts` exporting `blurDataUrl(hex: string): string` (an 8x8 SVG data URL filled with the tint colour).

- [ ] **Step 1: Measure before**

Run from `frontend/clipupp` with the dev server stopped: `npm run build 2>&1 | grep -A2 "○ /\[locale\]"` and note the First Load JS for `/[locale]`. Also `ls .next/static/media | wc -l` and the font file sizes (`du -ch .next/static/media/*.woff2 | tail -1`).

- [ ] **Step 2: Trim fonts**

In `app/[locale]/layout.tsx` change the two `next/font/google` calls:

```ts
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans", display: "swap", preload: true });
const zillaSlab = Zilla_Slab({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display", display: "optional", preload: true });
```

Grep every `font-display` user for weights 400 and 500 (`grep -rn "font-display" app components features | grep -E "font-(normal|medium)"`). Change each to `font-semibold` or `font-bold`. Inter 800 is used by `.clipupp-amt` (`font-weight: 800` in globals.css): change that rule to `700` so no synthetic bold appears.

- [ ] **Step 3: Preconnect**

Next to the existing preconnects add `<link rel="preconnect" href={process.env.NEXT_PUBLIC_MEDIA_ORIGIN ?? "https://pub-clipupp.r2.dev"} crossOrigin="" />`. Find the real R2 public host in `backend/clipupp/src/main/resources/application-dev.yml` (`R2_PUBLIC_BASE_URL`) and put it in `.env.example` as `NEXT_PUBLIC_MEDIA_ORIGIN`; never commit the secrets, only the public host.

- [ ] **Step 4: Blur helper with test**

`lib/img/blur.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { blurDataUrl } from "./blur";
describe("blurDataUrl", () => {
  it("returns an svg data url carrying the colour", () => {
    const u = blurDataUrl("#e8eefc");
    expect(u.startsWith("data:image/svg+xml")).toBe(true);
    expect(decodeURIComponent(u)).toContain("#e8eefc");
  });
});
```

`lib/img/blur.ts`:

```ts
export function blurDataUrl(hex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${hex}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
```

Use it in `DealImage.tsx` (`placeholder="blur" blurDataURL={blurDataUrl(tintBg)}`) and on the spotlight logo image if it is a `next/image` (skip if it is an inline logo tile).

- [ ] **Step 5: Lazy islands**

`components/site/lazy.ts`:

```ts
"use client";
import dynamic from "next/dynamic";
export const LazyCouponSheet = dynamic(() => import("@/features/catalog/components/CouponSheet").then((m) => m.CouponSheet), { ssr: false, loading: () => null });
export const LazySavedSheet = dynamic(() => import("@/features/home/components/SavedSheet").then((m) => m.SavedSheet), { ssr: false, loading: () => null });
export const LazyCategoriesMenuPanel = dynamic(() => import("@/components/site/CategoriesMenuPanel").then((m) => m.CategoriesMenuPanel), { ssr: false, loading: () => null });
```

`CouponSheetProvider` keeps its store subscription but renders `LazyCouponSheet` only after the first `open` call (`const [ever, setEver] = useState(false)` set when `seq > 0`). `BottomNavClient` renders `LazySavedSheet` the first time the saved button is pressed. Split `CategoriesMenu.tsx` into the trigger (stays, tiny) and `CategoriesMenuPanel.tsx` (mega grid + sheet body), rendered lazily on first open. Keep the server-rendered `<noscript>` or anchor fallbacks that exist (the reveal `/r/{id}` anchor must still work with no JS).

- [ ] **Step 6: Measure after and gate**

Rebuild, record First Load JS and font bytes in the commit body. Expect at least 25 KB JS and 2 font files saved. Run `npm run typecheck && npm run lint && npm run test`. Start the dev server again. Playwright smoke at 390: open a coupon reveal, confirm the sheet opens and the code copies; open the saved sheet; open the categories sheet.

- [ ] **Step 7: Commit**

```bash
git add -A frontend/clipupp
git commit -m "perf(home): trim fonts, lazy-load closed sheets, preconnect media, blur placeholders"
```

---

### Task 2: Client message catalogue limited to client namespaces

**Files:**
- Create: `frontend/clipupp/lib/i18n/clientNamespaces.ts`
- Modify: `frontend/clipupp/app/[locale]/layout.tsx:135-160`
- Test: `frontend/clipupp/lib/i18n/clientNamespaces.test.ts`

**Interfaces:**
- Produces: `CLIENT_NAMESPACES: readonly string[]` (top-level keys, e.g. `"header"`, `"sheet"`, `"toast"`, `"home"`, `"catalog"`, `"footer"`, `"mobileNav"`, `"strip"`, `"common"`, `"auth"`, `"account"`, `"admin"`), and `pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages`.

- [ ] **Step 1: Test that scans client files**

```ts
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { CLIENT_NAMESPACES } from "./clientNamespaces";
function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (!p.includes("node_modules") && !p.includes(".next")) walk(p, out); }
    else if (/\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}
describe("CLIENT_NAMESPACES", () => {
  it("covers every namespace a client component translates", () => {
    const root = join(__dirname, "..", "..");
    const missing = new Set<string>();
    for (const file of [...walk(join(root, "app")), ...walk(join(root, "components")), ...walk(join(root, "features"))]) {
      const src = readFileSync(file, "utf8");
      if (!/^\s*["']use client["']/m.test(src)) continue;
      for (const m of src.matchAll(/useTranslations\(\s*["']([^"'.]+)/g)) if (!CLIENT_NAMESPACES.includes(m[1])) missing.add(`${m[1]} (${file})`);
    }
    expect([...missing]).toEqual([]);
  });
});
```

Also assert `useTranslations()` with no argument is never used in a client file (regex `useTranslations\(\s*\)`), because that needs the whole catalogue.

- [ ] **Step 2: Implement**

```ts
import type { AbstractIntlMessages } from "next-intl";
export const CLIENT_NAMESPACES = [/* fill from the test's failing output */] as const;
export function pickClientMessages(all: AbstractIntlMessages): AbstractIntlMessages {
  const out: AbstractIntlMessages = {};
  for (const ns of CLIENT_NAMESPACES) if (ns in all) out[ns] = all[ns];
  return out;
}
```

In the locale layout pass `messages={pickClientMessages(messages)}` to `NextIntlClientProvider`. Run the test, fill the list until it passes. Measure the inline `__next_f` catalogue size before and after with `curl -s localhost:3000/ | wc -c` and record it in the commit body.

- [ ] **Step 3: Gate, commit**

```bash
git commit -am "perf(i18n): ship only client namespaces to the browser"
```

---

### Task 3: md breakpoint, fluid type, 2xl cap

**Files:**
- Modify: `frontend/clipupp/tailwind.config.ts:18` (add `md: "768px"` is a Tailwind default; the project only overrides `2xl` so `md` already exists. Verify with `npx tailwindcss` not needed: `md:` classes compile. Nothing to add; the task is to use it.)
- Modify: `frontend/clipupp/app/globals.css:689` (`.clipupp-container` max 1240 -> `max-width: min(1240px, 100% - 2 * var(--gutter))`, at `2xl` 1320px), `components/site/Rail.tsx` column vars, every rail/grid: `TrendingRail(Client)`, `DealsRail`, `BankOffersRail`, `SaleCalendarRail`, `TopStoresGrid`, `TodaysCouponsClient` list, `HeroSection` H1, `SpotlightCarousel`, `VerifyBand`, `FaqSection`, `Footer` grid.

- [ ] **Step 1: Column map**

Rail column widths per breakpoint (base / sm / md / lg): trending 80% / 46% / 31% / 4 columns; deals 46% / 30% / 23% / 6 columns; bank 76% / 44% / 32% / 4 columns; calendar 72% / 40% / 30% / 5 columns; stores grid 4 / 6 / 6 / 6 columns, "All stores" expander only below md; Today rows 1 / 2 / 2 / 2 columns; hero grid stacks below md, two columns from md with the spotlight at 44%; verify and faq grids `4fr 7fr` from md instead of lg; footer link columns `<details>` below md, open from md.

- [ ] **Step 2: Fluid type**

In `globals.css` add tokens under `:root`:

```css
--fs-h1: clamp(28px, 2.1rem + 1.6vw, 56px);
--fs-h2: clamp(22px, 1.2rem + 1vw, 32px);
--fs-lead: clamp(15px, 0.9rem + 0.35vw, 18px);
```

Replace the fixed H1 classes in `HeroSection.tsx:70` with `text-[length:var(--fs-h1)]`, section H2s in `SectionHeader.tsx` with `text-[length:var(--fs-h2)]`, and the hero lead with `text-[length:var(--fs-lead)]`. Drop the now-redundant `sm:text-[40px] lg:text-[56px]` pairs.

- [ ] **Step 3: Verify**

Playwright captures at 320, 390, 820, 1024, 1440, 1920 for `/` light, saved to the scratchpad. Assert: no horizontal overflow at any width; at 820 the trending rail shows 3 cards and the deals rail 4; at 1920 the container is 1320 wide and the H1 is 56px.

- [ ] **Step 4: Gate, commit**

```bash
git commit -am "feat(home): md breakpoint for every rail and grid, fluid display type, 2xl cap"
```

---

### Task 4: Chip rows, phone rhythm, press states, sliding tab underline, store best line, icon tiles

**Files:**
- Modify: `components/site/FilterChips.tsx`, `app/globals.css`, `features/home/components/TodaysCouponsClient.tsx` (tabs), `TopStoresGrid.tsx:45-46`, `CategoryRail.tsx` + `lib/home/categoryIcon.ts`, every section wrapper's phone padding.

- [ ] **Step 1: FilterChips edge fades and scroll padding**

Wrap the scroller in a relative div with `before:`/`after:` pseudo gradients (`from-clipupp-bg to-transparent`, 24px wide, `pointer-events-none`) that show only when scrollable on that side: a tiny `useScrollEdges(ref)` hook (`atStart`, `atEnd` via `scrollLeft`, listens to `scroll` and `resize`) toggles `data-start`/`data-end` attributes and CSS hides the matching fade. Add `scroll-padding-inline: 16px` and `scroll-snap-type: x proximity`, chips `scroll-snap-align: start`. Vitest for the hook's pure part: `edges(scrollLeft, scrollWidth, clientWidth)` returning `{ atStart, atEnd }` with cases (0,1000,300) -> start, (700,1000,300) -> end, (100,1000,300) -> neither, (0,300,300) -> both.

- [ ] **Step 2: Phone spacing scale**

Grep every section component for its outer padding. Apply one scale: phone sections `py-10` (40px), `md:py-14`, `lg:py-[72px]`; hero keeps its own values. Record the before/after per section in the report.

- [ ] **Step 3: Press states and card highlight**

In `globals.css` under `@layer components` add `.clipupp-press { @apply transition-transform active:scale-[0.98]; }` and apply to every `<button>` and chip in the homepage components and `RevealButton`. Add `.clipupp-card { box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.6); }` in light, `rgb(255 255 255 / 0.06)` in dark, applied to CouponCard, CouponRow, DealCard, BankOfferCard, SaleCard, StoreTile.

- [ ] **Step 4: Sliding tab underline**

In the Today tab list render one absolutely positioned `<span aria-hidden className="clipupp-tab-ink" />` whose `transform: translateX()` and `width` come from the selected tab's `offsetLeft`/`offsetWidth` (measured in a `useLayoutEffect` keyed on the selected id and on `resize`); transition 200ms transform only; under reduced motion no transition. Remove the per-tab underline border.

- [ ] **Step 5: Store best line everywhere and icon tiles**

`TopStoresGrid.tsx:46`: drop `hidden lg:block`, clamp to one line with `truncate`. `CategoryRail`: wrap each lucide icon in a 36px tinted circle (`bg-clipupp-tint-100 text-clipupp-primary`, hot category `bg-clipupp-bad-bg text-clipupp-danger`), icon 18px stroke 2.

- [ ] **Step 6: Gate, Playwright at 390 and 1440 (chips fade appears only when overflowing; tab ink moves on ArrowRight), commit**

```bash
git commit -am "polish(home): chip fades, phone rhythm, press states, tab ink, store best line, icon tiles"
```

---

### Task 5: Today state in the URL with scroll restore

**Files:**
- Create: `frontend/clipupp/features/home/lib/todayUrl.ts`
- Modify: `features/home/components/TodaysCouponsClient.tsx`
- Test: `features/home/lib/todayUrl.test.ts`

**Interfaces:**
- Produces: `parseTodayParams(sp: URLSearchParams, known: { tabs: string[]; sorts: string[] }): { tab: string; sort: string; store: string | null }` and `todayParamsToSearch(state, defaults): string` (empty string when everything is default).

- [ ] **Step 1: Tests**

```ts
import { describe, expect, it } from "vitest";
import { parseTodayParams, todayParamsToSearch } from "./todayUrl";
const known = { tabs: ["all", "fashion", "food"], sorts: ["pop", "new", "end", "rate"] };
describe("parseTodayParams", () => {
  it("falls back on unknown values", () => {
    expect(parseTodayParams(new URLSearchParams("tab=zzz&sort=nope"), known)).toEqual({ tab: "all", sort: "pop", store: null });
  });
  it("reads known values", () => {
    expect(parseTodayParams(new URLSearchParams("tab=food&sort=end&store=amazon"), known)).toEqual({ tab: "food", sort: "end", store: "amazon" });
  });
});
describe("todayParamsToSearch", () => {
  it("is empty for defaults", () => {
    expect(todayParamsToSearch({ tab: "all", sort: "pop", store: null })).toBe("");
  });
  it("serialises non-defaults only", () => {
    expect(todayParamsToSearch({ tab: "food", sort: "pop", store: "amazon" })).toBe("?tab=food&store=amazon");
  });
});
```

- [ ] **Step 2: Implement and wire**

Implement the two functions. In the client: read `useSearchParams()` on mount to seed tab/sort/store (URL wins over the `clipupp:tab` localStorage value); on change call `window.history.replaceState(null, "", pathname + search + "#today")` through a small `useUrlState` effect (no `router.replace`, which would refetch the RSC payload). Scroll restore: before navigating away via a coupon title link, store `{ y: window.scrollY, loaded: items.length }` in `sessionStorage` `clipupp:today:scroll`; on mount, if present and the URL hash is `#today`, restore `scrollY` after the first page renders, then clear. Keep `bfcache` friendly (no `beforeunload` listener).

- [ ] **Step 3: Gate, Playwright: open `/?tab=food&sort=end`, assert the Food tab is selected and the sort select shows Ending soon; change the sort, assert the URL updates without reload. Commit**

```bash
git commit -am "feat(home): today's coupons state lives in the url with scroll restore"
```

---

### Task 6: Search highlighting, clearable recents, no-results state, phone clear button

**Files:**
- Modify: `features/catalog/components/HeaderSearch.tsx`
- Create: `lib/format/highlight.tsx`
- Test: `lib/format/highlight.test.tsx`
- Messages: `header.search.clearRecent`, `header.search.noResults`, `header.search.noResultsHint`, `header.search.clear` (en + hi)

- [ ] **Step 1: Highlight helper with test**

`highlight(text: string, query: string): ReactNode[]` splits on the first case-insensitive match and wraps it in `<mark className="bg-transparent font-semibold text-clipupp-neutral-900">`. Tests: no query returns the plain text; "Amazon India" with "ama" yields three nodes with `mark` around "Ama"; no match returns the plain text; regex characters in the query are escaped.

- [ ] **Step 2: Wire**

Suggestion rows use `highlight(label, query)`. The recent-searches header gets a "Clear" text button (removes `clipupp:recent`, focus returns to the input). When a query of 2+ chars returns nothing: a row "No matches for {q}" plus the popular stores list under "Try a popular store". The input gets a clear (x) button when it has a value, 44px hit target, `aria-label` from `header.search.clear`.

- [ ] **Step 3: Gate, Playwright: type "zzzz" and assert the no-results row; type "ama" and assert a `<mark>`; press clear and assert the input is empty and focused. Commit**

```bash
git commit -am "feat(search): highlight matches, clear recents, no-results state, clear button"
```

---

### Task 7: Coming-soon tiles, sticky copied bar, report-not-working row, spotlight clamp

**Files:**
- Create: `features/home/components/ComingSoonTile.tsx` (server)
- Modify: `DealsRail.tsx`, `BankOffersRail.tsx`, `SaleCalendarRail.tsx` (render the tile instead of null when the list is empty and `!feed.demo`), `app/[locale]/(public)/page.tsx` (`sectionRenders` must count these as rendered so anchors resolve), `features/catalog/components/CouponSheet.tsx` (sticky bar + report row), `features/home/components/SpotlightCarousel.tsx` (text clamp)
- Create: `lib/home/useReports.ts` (zustand persist `clipupp:reports`: `{ [couponId]: { reason: string; at: number } }`)
- Messages: `home.soon.deals`, `home.soon.bank`, `home.soon.calendar`, `home.soon.cta` ("Get alerts"), `sheet.openStoreBar` ("Open {store}"), `sheet.copiedBar` ("Copied. Paste at checkout."), `sheet.report`, `sheet.reportWhy`, `sheet.reasonExpired`, `sheet.reasonInvalid`, `sheet.reasonMinOrder`, `sheet.reasonOther`, `sheet.reportThanks` (en + hi)
- Test: `lib/home/useReports.test.ts`, `features/home/lib/sectionRenders.test.ts` (extract `sectionRenders(code, feed)` from page.tsx into `features/home/lib/sectionRenders.ts` if not already a function)

- [ ] **Step 1: sectionRenders test**

Cases: `deals` with empty deals and `demo:false` renders (tile); `faq` with empty faq does not render; `bank_offers` with bank offers renders. Then implement the tile: a full-width card with the section eyebrow/title, a one-line body, and a ghost button linking via `anchorFor("alerts", rendered)`, hidden when that is null.

- [ ] **Step 2: Sticky bar**

In `CouponSheet`, below `lg` only, after the code box render a sticky bottom bar (`position: sticky; bottom: 0` inside the sheet body, `pb-[env(safe-area-inset-bottom)]`): left text "Copied. Paste at checkout." only when the clipboard write resolved (`copied === true`), otherwise the code itself; right a primary button "Open {store}" that is the existing `/r/{id}` anchor (`rel="nofollow sponsored noopener noreferrer"`, `target="_blank"`). Test the blocked-clipboard path in Playwright by overriding `navigator.clipboard.writeText` to reject: the bar must show the code, not "Copied".

- [ ] **Step 3: Report row**

Under the feedback Yes/No row, a "Report not working" disclosure that reveals four reason chips (expired, invalid, minimum order, other). Choosing one stores `{ reason, at }` under the coupon id in `useReports`, shows "Thanks, we will re-check this code." and hides the chips. The POST is wired in the backend phase; leave a one-line comment at the call site naming the endpoint `POST /api/v1/coupons/{id}/feedback` from the v3 spec. Vitest for the store: set, read, persisted key name, second report replaces the first.

- [ ] **Step 4: Spotlight clamp**

Slide title `line-clamp-2`, text `line-clamp-3`, perks list capped at 3 items; verify the hero height at 1440 is within 8px of the design (543px per the step 11 report).

- [ ] **Step 5: Gate, Playwright (390: reveal, bar shows and opens; report flow), commit**

```bash
git commit -am "feat(home): coming-soon tiles, phone copied bar, report-not-working row, spotlight clamp"
```

---

### Task 8: Hero gradient and grain, dark deal image halo, empty-slot polish

**Files:**
- Modify: `app/globals.css`, `features/home/components/HeroSection.tsx`, `DealImage.tsx` / `DealCard.tsx`

- [ ] **Step 1: Hero background**

Add `.clipupp-hero-bg` with a radial brand tint (`radial-gradient(60% 50% at 20% 0%, color-mix(in srgb, var(--clipupp-primary) 10%, transparent), transparent 70%)`) and a grain overlay via an inline SVG `feTurbulence` data URL at 4% opacity (`mix-blend-mode: multiply` light, `screen` dark), `pointer-events: none`, `aria-hidden`. Apply to the hero wrapper. Lighthouse must not regress: the SVG is under 1 KB and is CSS, not an image request.

- [ ] **Step 2: Dark halo**

For deal images in dark mode add `.clipupp-deal-img { mix-blend-mode: multiply }` in light (white product backgrounds blend into the tint) and in dark wrap the image in a white 8px-radius tile (`bg-clipupp-logo-bg`) so JPEG white backgrounds do not float as rectangles. Capture one deal card in both themes.

- [ ] **Step 3: Gate, commit**

```bash
git commit -am "polish(home): hero gradient and grain, deal image treatment in dark mode"
```

---

### Task 9: Committed Playwright suite with axe, CI job, Lighthouse CI budgets

**Files:**
- Create: `frontend/clipupp/playwright.config.ts`, `frontend/clipupp/tests/e2e/home.spec.ts`, `frontend/clipupp/tests/e2e/a11y.spec.ts`, `frontend/clipupp/tests/e2e/copy.spec.ts`, `frontend/clipupp/lighthouserc.cjs`
- Modify: `frontend/clipupp/package.json` (scripts `test:e2e`, `lhci`; dev deps `@axe-core/playwright`, `@lhci/cli`; keep `playwright` version), `.github/workflows/frontend-ci.yml` (job `e2e`: `npx playwright install --with-deps chromium`, build, `next start`, `npm run test:e2e` with `NEXT_PUBLIC_HOME_DEMO_FEED=true` and `BACKEND_URL` unset so the adapter falls back to the fixture), `.github/workflows/lighthouse-ci.yml` (use `lighthouserc.cjs` assertions)

- [ ] **Step 1: Config**

```ts
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
```

Check `@playwright/test` is installed (`playwright` alone is not the test runner); add it as a dev dependency at the same version if missing.

- [ ] **Step 2: Specs**

`home.spec.ts`: `/` and `/hi` render one H1, every section id from the fixture order exists, no horizontal overflow, no console errors other than the known Apollo logo 404; header search keyboard flow; reveal then sheet; heart toggles badge; Today ArrowRight moves selection; dark toggle persists across reload (desktop project only). `a11y.spec.ts`: `new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).exclude("[data-a11y-exception]").analyze()` on `/` light and dark, expect `violations` to equal `[]` (mark the Apollo monogram with `data-a11y-exception`). `copy.spec.ts`: rendered text of `/` and `/hi` contains no em dash, "cashback" or "WhatsApp".

- [ ] **Step 3: Lighthouse budgets**

`lighthouserc.cjs`:

```js
module.exports = {
  ci: {
    collect: { url: ["http://localhost:3000/", "http://localhost:3000/hi"], numberOfRuns: 3, settings: { preset: "perf", formFactor: "mobile", screenEmulation: { mobile: true } } },
    assert: {
      assertions: {
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 170000 }],
        "categories:performance": ["warn", { minScore: 0.9 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
```

Run it locally against a production build (`npm run build && npx next start -p 3000 & npx lhci autorun`). If LCP is still above 2500 after Tasks 1 and 2, set the LCP assertion to the measured value plus 200ms, record the number in the report, and leave a comment in the file naming the target 2500.

- [ ] **Step 4: Gate, run the suite locally green, commit**

```bash
git commit -am "test(home): committed playwright suite with axe and copy checks, lighthouse budgets in ci"
```

---

### Task 10: BreadcrumbList and Offer schema, hreflang assertion

**Files:**
- Create: `lib/seo/schemas/breadcrumb.ts`, `lib/seo/schemas/offer.ts`
- Modify: `lib/seo/schemas/index.ts`, `app/[locale]/(public)/page.tsx` (BreadcrumbList with one item "Home"), `features/home/components/DealsRail.tsx` (one `ItemList` of `Offer` entries via `JsonLd`, server-rendered, prices as numbers, `priceCurrency: "INR"`, `url` the deal link, `availability: "https://schema.org/InStock"`)
- Test: `lib/seo/schemas/offer.test.ts`, `tests/e2e/seo.spec.ts` (hreflang `en`, `hi`, `x-default` present on `/` and `/hi`; `application/ld+json` scripts parse and include `BreadcrumbList`, `FAQPage`, `ItemList`)

- [ ] **Step 1: Unit test for the offer schema**

```ts
it("maps a deal to an Offer", () => {
  expect(offerSchema({ title: "X", price: 999, mrp: 1299, url: "https://a/b", store: "Amazon" })).toMatchObject({ "@type": "Offer", price: 999, priceCurrency: "INR", url: "https://a/b", seller: { "@type": "Organization", name: "Amazon" } });
});
```

- [ ] **Step 2: Implement, wire, run the e2e seo spec, commit**

```bash
git commit -am "seo(home): breadcrumb and offer schema, hreflang asserted"
```

---

### Task 11: Final whole-branch verification

- [ ] Run `npm run typecheck && npm run lint && npm run test && npm run test:e2e` and `npm run build`; Lighthouse mobile before (step 11 report numbers) and after; update `frontend/clipupp/CLAUDE.md` with the new files (`lazy.ts`, `clientNamespaces.ts`, `todayUrl.ts`, `tests/e2e`, `lighthouserc.cjs`) and the md breakpoint rule.
- [ ] Commit `docs(frontend): refinement pass inventory`.
