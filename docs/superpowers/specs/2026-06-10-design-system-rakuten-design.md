# Design System Overhaul — Rakuten-inspired, flat & consistent

**Date:** 2026-06-10
**Branch:** `store_page_enhancement` (or a fresh `design-system` branch)
**Scope:** Frontend-wide — `frontend/clipupp/app/globals.css` (tokens),
`tailwind.config.ts`, font setup, and a sweep of components that hard-code
gradients / amber accent.

## Goal

Make the whole site visually consistent and "best-in-class" by adopting a
flat, single-brand-color system modeled on Rakuten's design tokens:
**one purple for all actions, status colors only for status, no gradients,
serif headings + sans body, indigo-tinted shadows.** Kill the current gradient
overuse and competing hues (purple + amber + crimson).

## Reference (extracted from rakuten.com + rakuten.com/f/allstores)

- Brand purple `#8529cd`; hover `#9b50d6`; pressed `#7119b8`; dark `#480081`.
- Text `#252525 / #575757 / #737373`; greys ramp to `#fafafa`.
- Status (one shade each): success `#33823f`, error `#b90037`,
  warning `#ee6b00`, info `#3e3e9d`.
- Radii: CTA `20px`, UI `8px`, tag `4px`.
- Spacing: `4 8 12 16 20 24 32 48 64`.
- Shadows tinted with indigo `#0a1646` (not black):
  default `0 4px 8px #0a164626`, hover `0 4px 11px #0a164633`,
  modal `0 4px 16px #0a164666`.
- Fonts: Stag (slab serif headings) + Rakuten Sans UI (body) — **proprietary,
  not usable.** Open-source matches chosen: **Zilla Slab** (headings) +
  **Inter** (body/UI). Big savings numbers stay heavy sans (weight 900).

## Constraints

- The token infrastructure already exists (`--clipupp-*` scale + `-soft` /
  `-strong` / `-fg` semantic suffixes, mirrored in `tailwind.config.ts`).
  This is a **values + roles** change, not a new system from scratch.
- Phase-1 compliant: no cashback. Coupon copy only.
- Keep zero-JS server rendering and `prefers-reduced-motion` support.

## Changes

### 1. Brand color → Rakuten purple (single source: CSS vars)
Re-point the `--clipupp-primary-*` scale (globals.css `:root`) to the Rakuten
purple ramp. Because every component reads the vars, this recolors the site
(header, buttons, links, badges) in one edit.

| Token | New value |
|---|---|
| primary-50  | `#f4f3fe` |
| primary-100 | `#e4e0fc` |
| primary-200 | `#cfc0ff` |
| primary-300 | `#bc9fea` |
| primary-400 | `#9b50d6` |
| primary-500 | `#8529cd` |
| primary-600 | `#7119b8` |
| primary-700 | `#480081` |
| primary (DEFAULT) | `#8529cd` (primary-500) |
| primary-strong | `#7119b8` |
| primary-soft | `#f4f3fe` |

Neutrals → Rakuten greys: `#252525 #575757 #737373 #949494 #b9b9b9 #dddddd
#f2f2f2 #fafafa`. Status → success `#33823f`, danger `#b90037`,
warning `#ee6b00` (new), info `#3e3e9d`.

### 2. Kill gradients → flat
- `.clipupp-btn-primary-gradient`, `.clipupp-btn-accent-gradient`,
  `.clipupp-coupon-cta`, `.clipupp-gradient-*`, `.clipupp-text-gradient-*`:
  collapse to **flat** `background: var(--clipupp-primary)` /
  `color: var(--clipupp-primary)`; hover → `--clipupp-primary-strong`.
  (Several already alias to solid — finish the rest.)
- Keep the coupon-card slide-reveal + sheen (interaction, not a gradient fill);
  the cover button becomes flat purple.
- Optional single exception: homepage hero band may keep one subtle gradient
  (matches CLAUDE.md "gradients only on hero"). Decide during execution.

### 3. Drop the amber accent
Remap every `clipupp-accent-*` usage:
- Code-CTA / "Flash" / "Exclusive" amber → **purple** (`primary`) or a
  **status** color where it means status. Card emphasis tabs:
  Flash → `warning-soft`, Recommended → `primary-soft`,
  Exclusive → `primary-soft`, Verified → `success-soft` (all light).
- Remove `accent` from `tailwind.config.ts` once unused, or alias `accent` →
  `primary` to avoid breakage during the sweep.

### 4. Indigo-tinted shadows
Update `--clipupp-shadow-*` (resting/hover/modal) to the `#0a1646` tints above.

### 5. Radii + spacing scale
Set CTA radius to `20px` (or `rounded-xl` ≈ 12–16px if 20 feels too round for
our denser cards — decide visually), UI `8px`, tag `4px`. Confirm the spacing
scale matches `4/8/12/16/20/24/32/48/64` (Tailwind default is close).

### 6. Fonts (Zilla Slab + Inter via next/font)
- Add `next/font/google` for **Zilla Slab** (`--font-display`) and **Inter**
  (`--font-sans`), self-hosted at build, `display: swap`, preloaded.
- Wire the CSS vars `--font-display` / `--font-sans` (already referenced
  across globals.css) to the new fonts in the root layout.
- Headings/titles → serif; body/UI → Inter; big savings numbers → Inter 900.

### 7. Semantic role layer (consistency enforcement)
Add role tokens that components consume instead of raw scale steps:
`--color-text`, `--color-text-muted`, `--color-text-subtle`,
`--color-action`, `--color-cta`, `--color-cta-fg`, `--color-surface`,
`--color-border`, `--color-success/error/warning/info`. Map to the scale.
Optional follow-up: an ESLint rule flagging raw hex in `features/` / `app/`.

## Migration plan (order of execution)

1. **Audit** — grep `accent`, `gradient`, raw hex, and `primary-[0-9]` usages
   across `app/` + `features/` to size the blast radius. `log()` the list.
2. **Tokens** — edit `:root` values in globals.css (color, shadow) +
   `tailwind.config.ts` if needed. Add semantic role tokens.
3. **Fonts** — next/font setup in root layout.
4. **Primitives** — flatten button / CTA / text-gradient / badge classes.
5. **Accent sweep** — replace `clipupp-accent-*` per the mapping above.
6. **Component spot-check** — header, hero, cards, forms, admin.
7. **Update docs** — `frontend/clipupp/CLAUDE.md` palette section + the
   "Clean Blue palette" naming (now purple).

## Verification

- `npm run typecheck` + `npm run lint` clean.
- **Visual regression:** `scripts/shot.mjs` / `scripts/crop.mjs` (Playwright)
  before/after on: home, a store page, `/coupons`, a coupon detail, sign-in,
  an admin page — desktop + mobile. Eyeball diffs for contrast/regressions.
- Contrast check: body text `#252525` on white = AA+; verify CTA text on
  purple and soft-badge text on soft-bg meet AA.

## Out of scope (separate efforts)
- Dark mode (tokens make it feasible later).
- Component-library / Storybook.
- Container-query refactor of cards (nice-to-have, not blocking).

## Risks
- Site-wide recolor touches every page — do it on its own branch, screenshot
  widely, review before merge.
- Removing `accent` can break stray callsites — alias `accent → primary`
  first, sweep, then remove.
- `20px` CTA radius may look too round on dense rows — validate visually,
  fall back to `12–16px` if so.
