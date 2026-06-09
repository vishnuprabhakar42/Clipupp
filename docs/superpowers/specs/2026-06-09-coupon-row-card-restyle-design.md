# Coupon Row Card Restyle — Design

**Date:** 2026-06-09
**Branch:** `store_page_enhancement`
**Scope:** Single component — `frontend/clipupp/features/catalog/components/CouponSavingsRowCard.tsx`

## Goal

Restyle the platform-wide coupon row card (store page + `/coupons`, `/offers`,
`/search`) to adopt the cleaner RetailMeNot/Coupons.com presentation from the
reference (corner badge tab, stacked savings number, merchant logo, type
sub-line) **without** changing the brand palette and **without** introducing
any cashback concept (Phase 1 = coupons only; copy never says "cashback").

## Constraints

- **Phase 1 compliant:** no "Cashback" / "Get Cashback" / "Terms & Exclusions"
  cashback framing. Coupon/deal copy only.
- **Keep brand palette:** purple/amber tokens (`clipupp-primary`,
  `clipupp-accent`, `clipupp-success`). No blue/black palette shift.
- **Server-rendered, zero client JS** — reveal stays a native `<details>`.
- One file changes. Same layout skeleton:
  `savings | dashed divider | title+meta | CTA`.

## Changes

### 1. Corner tab badge (new)
- Small rounded tab at the **top-left** of the card, inside the top edge,
  over the savings column.
- One badge, priority: `Exclusive` (amber, `clipupp-primary-soft` look) >
  `Verified` (green, `clipupp-success-soft`) > none.
- Only rendered on **non-stripe** cards. The existing full-width
  `Recommended` / `Flash deal` stripe stays and **suppresses** the corner tab
  (no double-badging).
- Exclusive/Verified are **removed** from the inline pill row (they live in the
  corner tab now) — prevents duplicates.

### 2. Stacked savings number
- Savings column shows a vertical stack:
  - optional small cap `UP TO` above (when label starts with "up to"),
  - big number (`10%`, `$45`, `15%`),
  - small cap `OFF` below (trailing qualifier word).
- **Color unchanged:** same purple/amber logic as today
  (`clipupp-text-gradient-savings` → solid primary; hot deals keep their
  treatment). Only the *layout* gains the stacked caption; color stays on-brand.
- Parser:
  - `UP TO` cap when `/^up to/i`.
  - Big token = first match of `/\$?\d[\d.,]*%?/` in the label.
  - `OFF` cap = trailing qualifier word (`off`, `sale`, etc.) when present.
  - Fallback (no parseable number): first 3 words of title, no caps (as today).

### 3. Type sub-line (new)
- Plain-text label under the title: `CODE` / `DEAL` / `FREE SHIPPING` /
  `IN-STORE`, derived from `coupon.type`. Muted, uppercase, small.

### 4. Pills row (kept)
- Green `NN% success` pill + `N uses` count remain.
- Exclusive/Verified pills removed (moved to corner tab).

### 5. Details link
- Rename "Show details" → **"See Details"**. Native `<details>`, brand purple
  link, unchanged behavior.

### 6. Merchant logo (new, conditional)
- Small logo + store name above the title, rendered **only when
  `storeLogoUrl` is present**. Null on store pages (all coupons same store) →
  auto-hidden; shows on `/coupons` and `/search` where it adds context.
- Uses `next/image`; `storeLogoUrl` hosts already in `remotePatterns`.

### 7. Button
- Unchanged: gradient CTA + dashed code-peek box.

## Data (existing `CouponSummary` fields, no API change)
`type`, `code`, `savingsLabel`, `verified`, `exclusive`, `usedCount`,
`popularityScore`, `storeLogoUrl`, `storeName`, `title`, `slug`.
No verified-date field exists → sub-line/badge says "Verified", not
"Verified working yesterday" (no fabricated dates).

## Out of scope
- No API/type changes. No palette change. No cashback. No changes to
  `CouponList`, filters, tabs, or other cards.

## Verification
- `npm run typecheck` + `npm run lint` clean.
- Visual check on a store page (`/stores/<slug>`) and `/coupons`:
  corner tab, stacked number, type sub-line, "See Details", success pill +
  uses, logo only off-store-page, no duplicate Verified/Exclusive, no cashback
  copy.
