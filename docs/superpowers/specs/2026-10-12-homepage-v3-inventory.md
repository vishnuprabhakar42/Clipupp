# Clipupp design v3 inventory

Source: /Users/vishnu/Downloads/Clipupp/index.html (1351 lines), data/feed.json, brands/*.
All facts below were read from the files as data; nothing was executed.
Note on file contents: the design is a single static page with hash links; every in-page link (`#today`, `#stores`) is a client-side filter or scroll, not a route.

## 1. Tokens

### 1.1 Colour custom properties (light, `:root`)

`--brand:#7c2ae8`.
`--brand-hover:#6a1fd0`.
`--brand-press:#5917b3`.
`--brand-ink:#ffffff` (text on brand).
`--deep:#2a0f52`.
`--deep-2:#3d1a72`.
`--gold:#ffd77a`.
`--tint-50:#f8f5fe`.
`--tint-100:#f1eafd`.
`--tint-200:#e2d3fb`.
`--page:#f6f5f9` (body background).
`--card:#ffffff`.
`--logo-bg:#ffffff`.
`--line:#e4e1ea`.
`--line-soft:#efedf3`.
`--ink:#1d1a24`.
`--ink-2:#55505f`.
`--ink-3:#77717f`.
`--ok:#1f7a3a`, `--ok-bg:#e6f4eb`.
`--bad:#c2183f`, `--bad-bg:#fdecef`.
`--warn:#b45309`, `--warn-bg:#fef3e2`.
`--skel:#ebe8f0`, `--skel-hi:#f6f4f9`.
`--ph-mix:100%` (strength of the deal-card placeholder tint).
`color-scheme:light`.
Note: brand here is `#7c2ae8`, the existing site uses `#8529CD`; `<meta name="theme-color">` is `#7c2ae8`.

### 1.2 Dark-mode overrides
Applied twice with identical values: under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`, and under `:root[data-theme="dark"]`.
`--brand:#a979f5`, `--brand-hover:#bb94f8`, `--brand-press:#9561ee`, `--brand-ink:#170a2e`.
`--deep:#251047`, `--deep-2:#321764`.
`--tint-50:#1b1626`, `--tint-100:#241c35`, `--tint-200:#352852`.
`--page:#111015`, `--card:#1b1920`, `--line:#2d2a35`, `--line-soft:#232029`.
`--ink:#f1eff5`, `--ink-2:#bdb7c8`, `--ink-3:#938d9f`.
`--ok:#5fcf80`, `--ok-bg:#15291c`, `--bad:#ff7393`, `--bad-bg:#33161e`, `--warn:#f3a84a`, `--warn-bg:#33240f`.
`--skel:#24212b`, `--skel-hi:#2e2a36`, `--ph-mix:16%`.
`--shadow-1:0 1px 2px rgba(0,0,0,.4)`, `--shadow-hover:0 14px 34px rgba(0,0,0,.5)`, `--shadow-pop:0 24px 60px rgba(0,0,0,.6)`.
`color-scheme:dark`.
`--gold`, `--logo-bg` and `--line` family other than listed are not overridden (gold stays `#ffd77a`, logo tile stays white).
The footer is a fixed deep-purple look in both themes with its own tokens: `--ft-bg:#170a2e`, `--ft-card:#211240`, `--ft-ink:#f3edff`, `--ft-ink-2:#bcaedb`, `--ft-ink-3:#9486b3`, `--ft-line:rgba(255,255,255,.11)`, `--ft-accent:#c9a6ff`.
Hard-coded hex outside tokens: WhatsApp green `#1f7a3a` / hover `#25904a` (footer button), `.ft-partner .btn` white on `#170a2e`, announcement strip text `#efe6ff`, `#d8c8f7`, spotlight text `#ddd0f6`, `#cdbcf0`, `#f1e9ff`, flag text `#3a2300`, card-art chip gradient `#f6d77d` to `#c9a03c`, per-category placeholder tints in JS (`CATTINT`: electronics `#e8eefc`/`#1f3f9a`, home `#fdf0e4`/`#a1500f`, fashion `#fbe9f1`/`#a3245b`, grocery `#e9f5e6`/`#2f6d1f`, beauty `#f6e8fb`/`#7b2a96`, default `#efeaf8`/`#5a3d99`).

### 1.3 Other tokens
Fonts: display `"Zilla Slab",Georgia,"Times New Roman",serif` at weights 600 and 700 (headings h1-h4, weight 600; h1 700; footer partner title).
UI: `Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif` at weights 400, 500, 600, 700, 800.
Google Fonts URL: `Zilla+Slab:wght@600;700` and `Inter:wght@400;500;600;700;800`, `display=swap`.
Monospace for code boxes: `ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`, 700 21px, letter-spacing .1em.
Numbers rule: every figure (₹1,999, 12%, 2.5K) is wrapped in `.n` (Inter, tabular and lining figures, 700, letter-spacing -.02em) so Zilla Slab never renders old-style digits. Inside h1-h3 `.n` is .9em weight 800. `.amt` is Inter 800 with a .64em rupee sign.
Base: body 15px/1.5 (16px at 1000px+), `-webkit-font-smoothing:antialiased`.
Type scale mobile / 640px+ / 1000px+: h1 28/40/56 (line-height 1.08, 700), h2 23/28/32 (1.15), h3 18 (1.25), eyebrow 11.5px 600 uppercase letter-spacing .07em, `.sub` 15/18.
Letter-spacing on headings -.01em, `text-wrap:balance`.
Radii: `--r-ctl:10px`, `--r-card:16px`, `--r-pill:9999px`; also in use 22px (spotlight slide, sheet, alert cards 20px), 14px (store tile, mega card, codebox), 12px (reveal button, trust cells), 9-10px (logos), 5-6px (tags, off badge).
Shadows: `--shadow-1:0 1px 2px rgba(29,26,36,.06),0 1px 1px rgba(29,26,36,.03)`, `--shadow-hover:0 14px 34px rgba(76,29,149,.12)`, `--shadow-pop:0 24px 60px rgba(20,8,48,.24)`; mega menu `0 24px 40px rgba(20,8,48,.14)`; collapsed header `0 6px 18px rgba(20,8,48,.08)`; slide `0 14px 34px rgba(42,15,82,.22)`.
Easing: `--ease:cubic-bezier(.2,0,0,1)`.
Spacing: `--gutter:16px` (24px at 640+, 32px at 1000+), `.section` padding-block 28px / 40px / 56px.
Layout vars: `--hdr-row:58px`, `--hdr-search:56px`, `--hv=row+search` (desktop: row 72px, search 0, hv 72px), `--safe-t`, `--safe-b` from `env(safe-area-inset-*)`.
Container: `max-width:1240px; margin:0 auto; padding-inline:var(--gutter)`.
Focus: `:focus-visible{outline:2px solid var(--brand);outline-offset:2px}`.
Touch targets: icon buttons 44px, chips 36px min, buttons 46px (sm 38px), bottom nav items 52px min.

### 1.4 Breakpoints
Only two width breakpoints: `min-width:640px` (tablet) and `min-width:1000px` (desktop).
Plus `prefers-color-scheme: dark`, `prefers-reduced-motion: no-preference` and `prefers-reduced-motion: reduce`.
JS mirrors the desktop breakpoint with `matchMedia('(min-width:1000px)')` (`isDesk`).
Note: the existing codebase uses Tailwind `lg` (1024px); 1000px is a design-specific value to decide on.

### 1.5 Motion
All gated behind `prefers-reduced-motion: no-preference` unless stated.
`pulse` 2s infinite on `.pulse-dot` (box-shadow ring 4px to 7px transparent).
`shim` 1.3s linear infinite on `.skel` (background-position to -200% 0).
`up` .5s `--ease` both, delay `calc(var(--i)*60ms)` on `.fx` hero items (opacity 0, translateY 8px to rest).
`megaIn` .2s (opacity 0, translateY -6px).
`sheetUp` .3s on `dialog[open] .sheet` (translateY 40%, opacity .4).
`sheen` 3.6s infinite on the reveal button cover (gradient sweep, 0-62% parked, per-card `--d` delay of (index mod 6)*.55s).
`peel` .42s `cubic-bezier(.5,0,.75,0)` forwards (cover slides to -102% with skewX(-8deg), opacity .3).
`codeIn` .42s (letter-spacing .4em to .1em, opacity .3).
`stamp` .35s on `.reveal-btn.done` (scale .96).
`heart` .4s `cubic-bezier(.3,1.6,.5,1)` on `.save.pop svg` (scale .6, 1.25, 1).
`okpop` .35s on `.copied-ok` (scale 1.08 at 50%).
`rise` .42s per child, delay `calc(var(--k)*45ms)`, `--k` capped at 8 (used on rails and row lists after each render).
`bump` .5s (defined, not referenced by script).
`rot` .8s linear infinite on the refresh icon while loading.
`marq` var(--dur, 60s) linear infinite on the ticker track (translateX to -50%), paused on hover; `--dur = items*5s`.
Under `reduce`: the ticker track becomes `overflow-x:auto`; JS also skips spotlight auto-advance, count-up, scramble, rise, peel, smooth scroll (uses `behavior:'auto'`).
Transitions: buttons .12s, card hover .2s `--ease`, dots .3s, `:active` scale .97 (buttons), .92 icon buttons, .8 save heart.
Header hide: `transform .25s var(--ease)`.
Toast: opacity/transform .2s, visible 2300ms.
Sheet drag-to-close: threshold 110px.
Desktop hover lift: `.cpn:hover,.pd:hover{translateY(-3px)}`, `.store:hover{translateY(-2px)}`, `--shadow-hover`.

### 1.6 Icons
Inline SVG sprite, stroke style (`fill:none; stroke:currentColor; stroke-width:1.8; round caps`), 20px (sm 16px).
Symbols: search, heart, check, shield, x, plus, l, r, bell, sun, moon, home, grid, tag, store, bolt, shirt, phone, food, plane, cart, sparkle, pill, play, sofa, diya, wa, ig, yt, tw, ext, copy, thumb, clock, refresh, cal.
Category icon map (`CATICON`): fashion shirt, electronics phone, food food, travel plane, grocery cart, beauty sparkle, recharge bolt, health pill, ott play, home sofa, marketplace store, festive diya.

## 2. Page structure in order

Count: 19 blocks (16 in-flow blocks including announcement strip, header, category rail, hero, ticker, popular-stores strip, trending, deals, today, bank, calendar, stores, verify, alerts, faq, footer; plus 3 overlays: bottom nav, dialog sheet, toast).
Document order in `<body>`: skip link, announcement strip, header (with mega menu), category rail, `<main>` (hero, ticker, popular stores strip, trending, deals, today, bank, calendar, stores, verify, alerts, faq), footer, bottom nav, dialog, toast, then JSON-LD script appended at runtime.
Every list-like block first renders skeleton placeholders (`.skel`, heights in each block below), then script replaces them.

### 2.0 Skip link
`<a class="skip" href="#main">Skip to content</a>`; visible on focus at top 12px.

### 2.1 Announcement strip (`#strip`)
Layout: single row, `--deep` background, min-height 40px, container.
Anatomy: diya icon (gold), message `<b id="diwali-days">` + " · Bank offers live", link "See offers" (gold, `href="#bank"`), dismiss X button (`aria-label="Dismiss announcement"`, `#strip-x`).
`#diwali-days` text is computed (see section 4.8): "Diwali in N days" / "Diwali is tomorrow" / "Happy Diwali!" / default "Festive season".
Dismiss persists in localStorage `clipupp:strip-x`.
Reads feed.json: nothing.

### 2.2 Header (`#hdr`)
See section 3.1.

### 2.3 Category rail (`#cats`, `<nav aria-label="Categories">`)
Layout: horizontally scrolling chip row (`#cat-rail`) on white with bottom border. Items 72px wide on mobile; on desktop `justify-content:space-between`, min-width 78px, 13px label.
Loading state: five `.skel` blocks 64x76.
Item anatomy (`button.cat[data-cat][aria-pressed]`): 50px rounded-square icon tile (tint-100 bg, brand icon), label below (12px). Pressed: brand-filled icon tile, brand text. `.hot` (Festive): deep bg, gold icon.
Reads: `categories[].id`, `.name`, `.icon`, `.hot`.
Click: `showCat(id)`: festive scrolls to `#calendar`; `all` clears store filter, sets tab, scrolls `#today`; otherwise sets the tab and scrolls `#today`.

### 2.4 Hero (`#top`, `section.hero`)
Background: radial gradient (900x300 at 90% -20%, tint-200) over tint-50, bottom border line-soft.
Layout: mobile single column (copy, then spotlight); desktop 1000px+ grid 6fr/5fr, gap 56px, padding 52px/56px, copy left and spotlight right, vertically centred.
Copy column in order (each with `.fx` stagger `--i` 0-5):
1. Eyebrow: "Coupons tested by people, every day".
2. H1: "Codes that **actually work** at Indian stores." ("actually work" in brand colour).
3. Sub: "Every code is applied at a real checkout before it reaches you. Copy it, paste it, pay less."
4. Search (desktop only, `display:none` below 1000px): form `role=search`, search icon, input `#hero-q` placeholder "Try Myntra, Swiggy or ‘HDFC’", clear button (hidden until text), primary button "Find codes"; suggestions listbox `#hero-sg`. Box height 58px on desktop.
5. Trust row (3 cells; on mobile a 3-column card grid, on desktop inline text): pulse dot + `#count` "codes verified today" (default text 2,418, count-up to `stats.verifiedToday`), `#st-rate` "worked last 7 days" (default 97%), `#st-stores` "Indian stores" (default 500+).
6. Popular row: label "Popular" + chips (`#popular`, `button.chip[data-store]`).
Spotlight column (`.spot`, `aria-roledescription="carousel"`, `aria-label="Festive spotlight offers"`): see 2.4.1.
Reads: `stats.successRate7d`, `stats.storeCount`, `stats.verifiedToday`, `stores[].popular` (chips: `popular <= 6`, sorted by `popular`), `stores[].id`, `stores[].name`.

#### 2.4.1 Spotlight carousel
Loading state: one `.slide.skel`.
Mobile: native scroll-snap rail, slide width 88% (70% at 640+), gap 12px, edge-bleeding gutters. Desktop: slide 100% width, single visible, radius 22px, min-height 360px, padding 28px, no gap.
Slide anatomy (`.slide`, deep purple with two radial glows, `role=group` `aria-roledescription=slide` `aria-label="i of n"`): top row [store logo 44px, store name + `kicker` small line, `flag` pill (gold bg, uppercase, 10.5px)]; `h3` from `title` (26px mobile, 36px desktop, numbers wrapped in `.n`); paragraph `text`; perks as pills (`perks[]`); CTA row: light button "Get this offer" (`data-open=couponId`), and "Offer till {d MMM}" (en-IN, only when `endsAt`).
Controls: dots (`#dots`, `role=tablist`, `role=tab` buttons `aria-label="{Store} offer"`, `aria-selected`, `data-dot`), active dot is a 22px pill; prev/next arrows (`#sp-prev`, `#sp-next`, `aria-label="Previous offer"` / `"Next offer"`) shown only on desktop.
Reads: `spotlight[].store`, `.kicker`, `.flag`, `.title`, `.text`, `.perks[]`, `.endsAt`, `.couponId`.
Auto-advance: every 5000ms unless user interacted (touchstart, pointerdown, focusin set a permanent flag), tab hidden, rail hovered, or reduced motion. Wraps around.

### 2.5 Live verification ticker (`#ticker`, `aria-label="Recently verified coupons"`)
Layout: full-width white strip, overflow hidden, infinite marquee. Fixed left label "Live" with green pulse dot (gradient fade).
Item anatomy: store logo 22px, **store name**, coupon `title`, green "✓ verified {ago}".
Content: 10 most recently verified coupons (`verifiedAt` desc), duplicated once (second copy `aria-hidden`) for the seamless loop; duration = 5s x item count.
Reads: `coupons[].store`, `.title`, `.verifiedAt`.

### 2.6 Popular stores strip (`<section aria-label="Popular stores">`, `#pop-stores`)
Layout: horizontal rail (`hrail stores-strip`), 68px columns mobile, 84px desktop.
Item (`button.ss[data-store]`): circular logo (62px mobile, 72px desktop, shadow-1), name truncated (12-13px).
Items: every store with `popular` set, sorted by `popular` (14 in demo).
Click: filters "Today's top coupons" to that store and scrolls there.
Reads: `stores[].popular`, `.id`, `.name`, `.logo` or `.mono/.bg/.fg`.

### 2.7 Trending coupons (`#trending`, `aria-labelledby="tr-h"`)
Heading: eyebrow "Most copied in the last hour", H2 "Trending coupons". No sub-copy.
Controls: desktop-only circular left/right arrows (`aria-label="Scroll left"` / `"Scroll right"`, `data-dir`), disabled at ends; filter chip row `#tr-filters` (`role=group`, `aria-label="Filter trending coupons"`).
Filters: "All" + one chip per category that has a coupon with `trending` set (label = category name). `aria-pressed`.
Loading: four `.skel` 290px tall.
Layout: horizontal scroll-snap rail. Column width: 80% mobile, 46% at 640+, `(100% - 72px)/4` at 1000+ (4 cards, gap 24px).
List logic: coupons with `trending`, filtered by chip, sorted by `trending` asc; if fewer than 4, pad with non-trending coupons of the same filter and cut to 8.
Card anatomy (ticket-stub `article.cpn`), in order:
1. Store logo 44px.
2. Store name (14px 600) with category name small underneath.
3. Heart save button (`data-save`, `aria-pressed`, `aria-label="Save {Store} coupon"`).
4. H3 `title` (20px, numbers wrapped).
5. Scope line `terms`.
6. Tags: green "✓ Verified {ago}"; deep/gold "Exclusive" if `exclusive`; red "Ends today" if `expiresAt` within 24h.
7. Perforation (dashed line with two half-circle notches).
8. Meta row: shield + "{success}% success" (green), "{short(uses)} used".
9. Reveal button (see 4.2): "Show code" cover with last 3 characters of the code visible on the right; or "Get deal" when no `code`; or the full code in green once revealed.
Desktop hover: lift 3px and `--shadow-hover`; hover widens the cover peel slightly.
Reads: `coupons[].id, store, title, terms, code, verifiedAt, success, uses, exclusive, trending, expiresAt`, `categories[].name`, `stores[].name/logo`.
Empty state: none specific (list would render empty).

### 2.8 Deals (`#deals`, `aria-labelledby="dl-h"`)
Heading: eyebrow (red) "Live price drops", H2 "Deals from Amazon, Flipkart and more".
Controls: arrows (`data-ctl="deal-rail"`), filter chips `#dl-filters` (`aria-label="Filter deals by store"`): "All deals" + one chip per distinct `source` (label = store name).
Loading: three `.skel` 330px.
Layout: rail, column 46% mobile, 30% at 640+, `(100% - 100px)/6` at 1000+ (6 cards, gap 20px).
Sort: by `endsAt` ascending (no `endsAt` last).
Filter: `source`.
Card anatomy (`article.pd`, product card):
1. Square image area tinted by category (placeholder category icon at 44% size, behind) with `<img>` overlay (removed on error) when `image` exists.
2. Top-left red badge "{off}% off" when `off` > 0.
3. Top-right source store logo 30px.
4. Title (2-line clamp, 13.5px).
5. Rating chip: green "{rating to 1 decimal} ★" + "({short(reviews)})" when `rating`.
6. Price row: big `₹price` (Inter 800), struck `₹mrp`, green "{off}% off" when `mrp > price`.
7. "Lowest price in 30 days" (green 11.5px 600) when `lowest30d`.
8. Button "Buy on {Store}" (primary, `target=_blank`, `rel="noopener sponsored nofollow"`).
Not rendered despite being in the data: `claimed` (see 4.7), `DeliveryInfo.IsPrimeEligible`.
Empty state: `<p class="empty-state">No live deals right now. Check back in a bit.</p>`.
Normalised fields: `store, id, title, price, mrp, image, url, rating, reviews, source, cat, endsAt, claimed, lowest30d, off`.
Items without title, price > 0, or a known store are dropped.

### 2.9 Today's top coupons (`#today`, `aria-labelledby="td-h"`)
Heading: eyebrow "All coupons", H2 "Today’s top coupons".
Right of header: sync status `#sync`: text `#sync-t` ("Updating…" then "Updated {ago}") and refresh icon button (`aria-label="Refresh coupons"`, spins while loading).
Tabs (`#tabs`, `role=tablist`, `aria-label="Coupon categories"`): "All" + every category except `festive`, each with a small count of coupons; categories with zero coupons are hidden unless selected. Selected tab: brand colour with 3px underline; roving tabindex; Left/Right arrow keys wrap and select. On mobile the tab bar is sticky under the header (`top: safe-t + --hv`), on desktop static.
Tools row: active count `#list-count` ("Loading coupons" then "{n} coupon(s)"), optional dismissible store-filter chip (label store name + X, `aria-label="Clear store filter {Store}"`), sort select `#sort` (label `.sr` "Sort coupons") with options: "Most used" (`pop`, by `uses` desc), "Best success rate" (`rate`), "Recently verified" (`new`), "Ending soon" (`end`, by `expiresAt` asc).
List (`#rows`, `role=tabpanel`): 1 column mobile, 2 columns at 640+. Loading: three `.skel` 150px.
Filter: tab category (category derived from the coupon's store `cat`), store filter, and hides coupons whose `expiresAt` has passed.
Pagination: `CONFIG.pageSize` 10; "Show more coupons" ghost button (`#more`, hidden when no more) plus an IntersectionObserver sentinel (`rootMargin:300px`) that auto-loads 10 more on scroll.
Row anatomy (`article.row`; mobile: [discount tile | info] then full-width reveal button; desktop: three columns with a 170px reveal column):
1. Discount tile (56px, 64px desktop) showing `badge` (e.g. "12%") with a small caption "off" if badge contains % or ₹, else "deal".
2. Store line: 20px logo, store name, optional "Exclusive" tag, optional "Ends today" tag.
3. H3 `title` (Inter 15px 600; not serif here).
4. Meta: "✓ Verified {ago}" (green), "{success}% success", "{short(uses)} used".
5. Reveal button (as in 4.2).
Empty state (`.empty-state`): tag icon, bold "No coupons here yet.", "Try another category, or turn on alerts and we’ll tell you when one lands.", ghost small button "Turn on alerts" (href `#alerts`).
Error state (`#feed-err`): see 4.10.

### 2.10 Bank and card offers (`#bank`, `aria-labelledby="bk-h"`)
Heading: eyebrow "Stack with any coupon", H2 "Bank and card offers", sub "Applied when you pay, on top of the code you copy here."
Controls: arrows (`data-ctl="bank-rail"`), chip row `#bank-filters` (`aria-label="Filter by bank"`): "All" + each distinct `bank` in feed order.
Loading: two `.skel` 220px.
Layout: rail, column 76% mobile, 44% at 640+, `(100% - 72px)/4` at 1000+.
Card anatomy (`article.bo`):
1. Decorative card art (64px tall, `aria-hidden`): linear-gradient(135deg, `art[0]`, `art[1]`), bank name in caps top-left, gold EMV chip bottom-right, translucent circle accent.
2. H3 `title` (numbers wrapped).
3. Paragraph `terms`.
4. Footer button (`data-store`): store logo 24px, "On {Store}", right chevron; click filters Today's coupons to that store.
Reads: `bankOffers[].bank, .art[2], .store, .title, .terms`.
Empty state: none.

### 2.11 Festive sale calendar (`#calendar`, `aria-labelledby="cl-h"`)
Heading: eyebrow "Plan your cart", H2 "Festive sale calendar", sub "Tap Remind me and we’ll tell you the morning a sale opens."
Controls: arrows (`data-ctl="cal-rail"`).
Loading: two `.skel` 220px.
Layout: rail, column 72% mobile, 40% at 640+, `(100% - 96px)/5` at 1000+.
Sort: state order live, soon, ended; then `startAt` asc. State is computed against now: `ended` if now > `endAt`, `live` if now >= `startAt`, else `soon`.
Card anatomy (`article.ev.is-{state}`; live has brand border and tint gradient; ended is 60% opacity):
1. Store logo 36px and a state label: pulse dot + "Live now" / "Coming up" / "Ended".
2. H3 `name`.
3. Paragraph: **{Store}.** `text`.
4. Date line: calendar icon + "{d MMM} to {d MMM}" (`startAt` to `endAt`, en-IN).
5. Action: live: primary small "See {Store} codes" (`data-store`); soon: ghost small toggle "Remind me" (bell) / "Reminder set" (check), `aria-pressed`, `data-bell=id`; ended: none.
Reminder state stored in localStorage `clipupp:bells`; toast "We’ll remind you when {name} opens" / "Reminder removed". No notification is actually sent.
Reads: `sales[].id, store, name, startAt, endAt, text`.

### 2.12 Top stores (`#stores`, `aria-labelledby="st-h"`)
Heading: eyebrow `#st-eyebrow` "{storeCount} stores" (default "500+ stores"), H2 "Top stores". No sub-copy.
Layout: grid 4 columns mobile, 6 at 640+; gap 10px (14px desktop).
Count shown: desktop 12, mobile/tablet 7 plus an "All stores" tile (8th) that expands to all stores; once expanded all are shown. Sorted by `popular` asc (stores without `popular` after, sorted by name).
Tile anatomy (`button.store[data-store]`): logo (46px, 52px desktop), name (bold, ellipsis on mobile, wraps on desktop), "{coupons} coupons", and on desktop only a green `best` line pinned to the bottom. Desktop tiles are left-aligned; mobile centred.
"All stores" tile (`.store.all`, tint bg): grid icon tile, "All stores", "{n} listed" (`data-all-stores`).
Reads: `stores[].id, name, logo/mono/bg/fg, coupons, best, popular`.

### 2.13 How we verify (`#verify`, `section.verify-band`, `aria-labelledby="vf-h"`)
Layout: white band with top and bottom border; mobile stacked; desktop 4fr/7fr grid, gap 64px, padding 72px.
Left: eyebrow "How we verify", H2 "Every code is tested before you see it.", lead "Most coupon sites scrape codes and hope. We run each one through a real checkout, record the result and show it to you."
Stats (3, each with 3px brand left border): `#vs-today` "codes checked today" (from `stats.verifiedToday`, en-IN grouping), `#vs-rate` "success, last 7 days" (`stats.successRate7d` + "%"), static "<1 hr" "to pull a failed code".
Right: ordered list of 3 steps (numbered tiles via CSS counter):
1. **We apply it at a real checkout** - "A person adds a qualifying cart and enters the code, every 24 hours. Not scraped, not guessed."
2. **You see the real success rate** - "Each card shows when it was last checked and how often it worked for shoppers in the last 7 days."
3. **Failed codes come down within the hour** - "Tell us a code didn’t work with one tap. Two reports trigger a re-check and the code is hidden until it passes."

### 2.14 Deal alerts (`#alerts`)
Heading: visually hidden H2 "Deal alerts".
Layout: two cards, stacked mobile, two columns at 640+.
Card 1 (green-tinted, `.al.wa`): eyebrow (green) "WhatsApp alerts", H3 "The day’s 5 best codes, at 9 am.", muted "One message a day. Reply STOP any time.", form `#wa-form`: field with "+91" prefix and input `#wa-num` (`type=tel`, `inputmode=numeric`, `maxlength=10`, placeholder "10-digit mobile number", `aria-label="Mobile number"`, `autocomplete=tel-national`), primary button "Get alerts"; message line `#wa-msg` (`aria-live=polite`).
Card 2: eyebrow "Weekly email", H3 "Ten codes worth knowing, every Sunday.", muted "Plus sale dates before they’re announced. No spam.", form `#nl-form`: input `#nl-email` (`type=email`, placeholder "you@example.com", `aria-label="Email address"`, `autocomplete=email`), button "Subscribe"; message `#nl-msg`.
Behaviour: see 3.6.

### 2.15 FAQ (`#faq`, `aria-labelledby="fq-h"`)
Layout: stacked mobile; desktop 4fr/7fr. Left: eyebrow "Help", H2 "Questions shoppers ask", muted "Still stuck? Write to help@clipupp.in and a person replies within a day." Right: `<details>` accordion, first open, plus icon rotates 45deg when open.
Questions and answers verbatim in section 6.
JSON-LD `FAQPage` is generated from the same array (see section 9).

### 2.16 Footer
See 3.8 for anatomy.

### 2.17 Bottom nav (`nav.bnav`, `aria-label="Quick navigation"`)
Mobile and tablet only (hidden at 1000px+). See section 8.

### 2.18 Dialog sheet (`<dialog id="dlg" aria-labelledby="dlg-title">`)
One native dialog reused for three contents: coupon detail, saved coupons, mobile categories menu.
Mobile: bottom sheet (radius 22px 22px 0 0, grab handle, drag down more than 110px to close, max-height `100dvh - safe-top - 24px`). Desktop: centred modal, max-width 480px, fully rounded.
Backdrop `rgba(14,6,30,.55)`; `html` overflow hidden while open; focus returns to the opener on close.
Coupon detail content: header [store logo 50px, store name + "{store.coupons} coupons · {Category}" small, heart save, close X]; H2 `title`; muted `terms`; code box (dashed brand border, code in monospace 21px, "Copy" ghost button which becomes "Copied" with green style for 2.2s) or, for no code, solid box "No code needed. The price drops at the store."; meta "Verified {ago} · {success}% success" and "{uses} used"; primary full-width link "Copy code and open {Store}" (or "Shop now on {Store}") with external icon, `target=_blank`, `rel="noopener sponsored nofollow"`, href = `stores[].url`; numbered how-to list (only with a code): "Copy the code above." / "Add items to your {Store} cart and go to checkout." / "Paste it in the coupon box and tap Apply."; feedback row "Did this code work?" (or "deal") with Yes / No buttons; link "See all {n} {Store} coupons".
Feedback replies: Yes: "Thanks! That helps other shoppers." No: "Thanks for telling us. We’ll re-check this code within the hour." (client-side text only; nothing is sent).

### 2.19 Toast (`#toast`, `role=status`, `aria-live=polite`)
Fixed pill centred above the bottom nav (bottom 76px + safe area; 28px desktop), check icon + message, 2300ms.
Messages used: "Coupons up to date", "Email copied", "Select the email to copy it", "हिन्दी version is coming soon", "Removed from saved", "Saved. Find it under the heart.", "Code {code} copied", "Code selected. Long-press to copy.", "We’ll remind you when {name} opens", "Reminder removed".

## 3. Header and global UI

### 3.1 Header anatomy
Sticky (`position:sticky; top:safe-top; z-index:60`), white card background, bottom border.
Mobile (below 1000px) two rows via CSS grid areas: row 1 `logo | actions`, row 2 full-width search. Row 1 is 58px; search row 56px.
Desktop (1000px+): one 72px row, grid `auto | minmax(0,560px) | 1fr`, gap 28px: wordmark, search, actions.
Wordmark: `logo-mark.png` (38x33, 43px wide on desktop, `fetchpriority=high`) + text "Clip" + "upp" (brand colour), Inter 700 28px (31px desktop), letter-spacing -.04em; `aria-label="Clipupp home"`, `href="#top"`.
Actions (`nav aria-label="Primary"`), left to right:
1. Categories button `#cat-btn` (grid icon; on desktop shows label "Categories" and a chevron; `aria-expanded`, `aria-controls="cat-menu"`, `aria-label="Categories"`).
2. "Stores" text link (desktop only; `href="#stores"`).
3. Theme toggle `#theme` (icon button).
4. Saved (heart icon button, `data-open-saved`, `aria-label="Saved coupons"`) with red count badge `[data-saved-count]` (hidden at 0).
5. Deal alerts bell (link to `#alerts`, `aria-label="Deal alerts"`).
No sign-in, account or locale control in the header.
Search: see 3.3.
Phone scroll behaviour: row 1 hides (`translateY(-58px)`) when scrolled past 160px while scrolling down by 6px or more; reappears when scrolling up 6px or when scrollY < 80. Class `hdr-c` on `<html>`; `--hv` shrinks to the search height so sticky tabs follow. Disabled on desktop.

### 3.2 Category mega menu (`#cat-btn`, `#cat-menu`, `#mega-grid`)
Desktop: full-width panel under the header (`position:absolute; top:100%`), white, `megaIn` animation. Head: "Shop by category" (uppercase 12px) and link "All coupons" with chevron (`data-cat="all"`). Grid `#mega-grid`: 4 columns at 1000+, 3 at 640+, 2 on phones, gap 10px.
Card (`button.mc[data-cat]`): 44px icon tile (Festive uses deep and gold), bold category name, small subline: Festive "Sale calendar and bank offers"; otherwise the top 3 store names in that category by `coupons` desc joined with ", "; fallback "{n} coupons".
Close: outside click (capture phase), Escape (returns focus to the button), selecting a category, resize across the breakpoint.
Mobile: the same grid is shown in the bottom-sheet dialog, header "Categories" with small "{n} verified coupons" (n = total coupons) and a close X. The visually hidden H2 "Categories" is the dialog title.
Reads: `categories[]`, `stores[].cat/name/coupons`, `coupons[].cat` (via store).

### 3.3 Search with suggestions
Two instances share one implementation: header `#hdr-q` + `#hdr-sg` (header placeholder "Search Myntra, Swiggy, bank offers…") and hero `#hero-q` + `#hero-sg` (hero placeholder "Try Myntra, Swiggy or ‘HDFC’"). Both inputs: `role=combobox`, `aria-expanded`, `aria-controls`, `aria-autocomplete=list`, `enterkeyhint=search`, 16px text; listbox `role=listbox` with `role=option` buttons.
Header search shows a `/` keyboard hint (`kbd`, desktop only). Pressing `/` anywhere outside an input/textarea/select (and with the dialog closed) focuses `#hdr-q`.
Client-side only, over the loaded feed; opens on focus; input debounce 60ms; closes on blur after 150ms; `mousedown` on the panel is prevented to keep focus.
Empty query: "Recent" section (chips, max 5, localStorage `clipupp:recent`, newest first, de-duplicated case-insensitively, saved on pick/submit) then "Popular stores" (the stores with `popular <= 4`, i.e. 4 rows) each "{n} coupons".
Typed query (lower-cased substring match):
- Bank intent: if the query matches `/bank|card|hdfc|sbi|icici|axis|kotak|rbl/`, a "Jump to" row "Bank and card offers" ("{n} offers", n = `bankOffers.length`) that scrolls to `#bank`.
- "Stores": max 5, store `name` or its category name contains the query; meta "{coupons} coupons".
- "Coupons": max 5, matching "{store name} {title} {code}"; label is the `title` with match highlighted, meta store name; selecting opens the coupon sheet.
- "Deals": max 3, `title` contains the query; meta `₹price`; selecting scrolls to `#deals`.
- No results: `No match for “{q}”. Try a store name like Myntra or Swiggy.`
Panel max height `min(66vh,460px)`, scrolls.
Keyboard: ArrowDown/ArrowUp move `aria-selected` (clamped, no wrap, scrolls into view); Enter in the form picks the active option or the first; Escape closes; the clear (X) button empties and refocuses.
Hero form has a "Find codes" submit with the same pick behaviour. No navigation to a search results page exists.
Row heights 48px minimum; matches highlighted with `<mark>` in brand colour.

### 3.4 Theme toggle (`#theme`, icons `i-moon` / `i-sun`)
Three-state resolution: stored choice in localStorage `clipupp:theme` ("light" or "dark") sets `data-theme` on `<html>`; with nothing stored the system `prefers-color-scheme` applies.
Icon shows a sun when currently dark (switch to light), a moon when light; `aria-label` "Switch to light theme" / "Switch to dark theme" (initial HTML label "Switch colour theme").
No inline pre-paint script: the stored theme is applied by the end-of-body script, so a returning dark-mode user may flash light first.

### 3.5 Saved coupons (`#dlg`, `data-save`, `data-open-saved`)
Storage: localStorage `clipupp:saved` is an array of coupon ids; no account, no server. "Saved on this device".
Toggle: any heart (`[data-save=id]`) adds/removes; all hearts and both count badges (header and bottom nav) sync; heart pops (animation) on add; vibrates 12ms where supported; toast "Saved. Find it under the heart." / "Removed from saved".
Dialog (opened by the header heart or the bottom nav "Saved"): header "Saved coupons" with small "{n} saved on this device", close X; body shows each saved coupon as a full list `row` (with its reveal button); empty state: heart icon, bold "Nothing saved yet.", "Tap the heart on any coupon to keep it here."
Saved ids not present in the current feed are silently dropped from the list (count may differ from the badge).

### 3.6 Deal alerts (`data-bell`, `#alerts`)
Sale reminders (`data-bell`) are per-sale toggles in localStorage `clipupp:bells` (see 2.11).
WhatsApp form: input is filtered to digits and capped at 10 as you type. Submit validates `/^[6-9]\d{9}$/`. Error (red): "Enter a 10-digit Indian mobile number that starts with 6, 7, 8 or 9." and refocus. Success (green): "Done. Your first alert reaches +91 {first5} {last5} tomorrow at 9 am." then reset and vibrate. Nothing is sent to a server.
Email form: submit validates `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`. Error: "That email looks incomplete. Check for the @ and the domain." Success: "Subscribed. The next digest arrives Sunday morning." Nothing is sent to a server.
The header bell is just a link to `#alerts`.

### 3.7 Copy email (`#copy-mail`)
Footer partner card button "Copy email" writes `partners@clipupp.in` via `navigator.clipboard.writeText`; success: toast "Email copied" and the button text becomes "Copied" (not reset); failure: toast "Select the email to copy it". The `<code>` is `user-select:all`.

### 3.8 Footer anatomy
Fixed deep-purple look in both themes. Container padding 28px 20px (40px 28px desktop).
Trust row (3 items, icon tile + bold line + muted line; 3 columns at 640+):
- shield: "Every code tested daily" / "Applied at a real checkout every 24 hours".
- tag: "Free, always" / "No sign-up, no wallet, no hidden fees".
- store: "{storeCount}+ Indian stores" (`#ft-stores`, default 500+) / "Fashion, food, travel, electronics and more".
Main grid (desktop `1.5fr` + 4 columns; mobile columns are collapsible `<details>`, forced open on desktop by JS with `summary` pointer-events disabled):
- Brand column: wordmark, about text "Verified coupon codes and bank offers for Indian shoppers. Copy a code, paste it at checkout, pay less.", social icon buttons Instagram, YouTube, X (to `https://www.instagram.com`, `https://www.youtube.com`, `https://x.com`, `rel=noopener`; generic homepages, not Clipupp accounts), green pill link "Get daily codes on WhatsApp" (`href="#alerts"`).
- "Top stores": stores with `popular <= 8` sorted by `popular` (`data-store` links; static fallback Amazon, Flipkart, Myntra, Swiggy).
- "Categories": first 8 categories excluding `festive` (`data-cat`; static fallback Fashion, Electronics, Food, Travel).
- "Clipupp": How we verify (`#verify`), Sale calendar (`#calendar`), Bank offers (`#bank`), Deal alerts (`#alerts`), About us (`#faq`), Careers (`#faq`).
- "Help and legal": Help and FAQ, Contact us, Privacy policy, Terms of use, Affiliate disclosure, Grievance officer (all `href="#faq"`; no real legal pages exist in the design).
Partner card: bold "Run an online store?", "List your coupons on Clipupp and reach shoppers who are ready to buy.", `partners@clipupp.in` code, button "Copy email".
Popular searches (`nav.cloud`, `aria-labelledby="ps-h"`, H2 "Popular searches" in the footer): 16 static pipe-separated links, all to `#today`: see section 6.
Disclosure paragraph (legal line) and bottom row: "© 2026 Clipupp · Made in India", language group (English pressed; "हिन्दी" shows toast "हिन्दी version is coming soon"), "Back to top" link.
Note: footer email domains in the design are `.in` (`partners@clipupp.in`, `help@clipupp.in`), while the project is clipupp.com.

### 3.9 Cookie or consent UI
None in the design. The existing site has `CookieBanner.tsx` which must be kept.

### 3.10 Sticky or fixed elements
Header (sticky), tabs bar (sticky on mobile only), bottom nav (fixed, below 1000px), toast (fixed), ticker label (absolute). Skip link on focus.

## 4. Interactions

### 4.1 `data-*` attributes and ids
`data-search`: wrapper for the search widget; the script wires every element carrying it (header and hero).
`data-q` (recent chip): fills the input with that query and rebuilds suggestions.
`data-pick-store` / `data-pick-id` / `data-go` (suggestion options): pick a store (filter coupons), open a coupon sheet, or scroll to `bank` / `deals`.
`data-cat`: category rail items, mega-menu cards, footer category links, "All coupons" link. Runs `showCat`: closes dialog and mega menu first. `festive` scrolls to `#calendar`.
`data-store`: popular-store chips/strip, store tiles, bank-card footer, live-sale button, footer store links, sheet link, hero chips. Runs `showStore`: sets `ui.store`, resets tab to All and limit to 10, re-renders tabs and rows, scrolls to `#today`.
`data-all-stores`: expands the Top stores grid to all.
`data-open` (coupon id): reveal buttons and spotlight CTA. Opens the coupon sheet (see 4.2).
`data-save` (coupon id): heart toggle (3.5).
`data-open-saved`: opens the saved dialog (header heart, bottom nav).
`data-saved-count`: badge elements kept in sync.
`data-bell` (sale id): reminder toggle.
`data-trf`, `data-dlf`, `data-bk`: trending category, deals source, bank filters (each re-renders its rail and resets scroll to 0).
`data-tab`: the "Today" tabs.
`data-dir` (-1 / 1) inside `data-ctl="{railId}"`: scroll arrows; scroll by 90% of the rail width, smooth; buttons disabled within 4px of either end; state updated on scroll.
`data-dot`: spotlight dot index.
`data-nav`: bottom nav active tracking (home `top`, `deals`, `today`, `stores`).
`data-close`: closes the dialog (also backdrop click).
`data-fb` (1 / 0): "Did this code work?" Yes / No.
`data-hi`: Hindi button toast.
`data-theme` (on `<html>`): light/dark override.
Other ids: `hdr`, `strip`, `cats`, `cat-rail`, `count`, `st-rate`, `st-stores`, `popular`, `spot-rail`, `dots`, `sp-prev`, `sp-next`, `ticker`, `ticker-track`, `pop-stores`, `rail`, `deal-rail`, `tr-filters`, `dl-filters`, `bank-rail`, `bank-filters`, `cal-rail`, `store-grid`, `tabs`, `rows`, `sort`, `more`, `sentinel`, `list-count`, `active-filter`, `feed-err`, `sync`, `sync-t`, `sync-b`, `cloud`, `faq-list`, `ft-stores`, `ft-stores-l`, `ft-cats-l`, `cp`, `go-store`, `fb`, `dlg-body`, `sheet`, `toast`.

### 4.2 Coupon reveal and copy flow (step by step)
1. Unrevealed card shows a dashed "Show code" control: brand-filled cover with a tag icon and "Show code", a diagonal cut right edge, a periodic sheen sweep, and the last 3 characters of the code visible on the right (`code.slice(-3)`). On desktop hover the cover narrows slightly.
2. Click anywhere on it. If motion is allowed and the control is not already revealed/deal: set the last-3 text to the full code, add `.peel` (cover slides off to the left, code letter-spacing animates), vibrate 12ms, and open the sheet after 360ms.
3. With reduced motion the sheet opens immediately.
4. `openCoupon(id)`: if the coupon has a code and is not yet in `clipupp:revealed`, add it and persist, then replace every reveal button for that id on the page with the revealed state (green "done" button showing the full code, `aria-label="Code {code}, open details"`).
5. Sheet content renders (2.18); the code is copied to the clipboard automatically (`navigator.clipboard.writeText`), the Copy button flips to "Copied" for 2.2s, toast "Code {code} copied", focus moves to the Copy button, and the code text "scrambles" for 520ms before settling (random characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, reduced motion skips).
6. Clipboard failure fallback: the code text is selected and toast says "Code selected. Long-press to copy."
7. Clicking the primary link "Copy code and open {Store}" copies again and opens the store `url` in a new tab (`rel="noopener sponsored nofollow"`).
8. Coupons without a `code`: the button reads "Get deal" (solid brand button), the sheet shows "No code needed. The price drops at the store." and the link reads "Shop now on {Store}".
9. Revealed state persists across reloads via localStorage; clicking a revealed button just reopens the sheet.
10. The link target is the store home `url`; there is no per-coupon outbound redirect or click tracking in the design.

### 4.3 Countdown and time handling
There is no live countdown timer. `endsAt` / `expiresAt` handling:
- Spotlight: "Offer till {d MMM}" static date.
- Coupons: `expiresAt` within the next 24h shows a red "Ends today" tag; expired coupons are removed from the Today list (but not from trending, ticker or search).
- Deals: `endsAt` only sorts the rail (soonest first); not displayed.
- Sales: `startAt`/`endAt` drive Live/Coming up/Ended and the date range label.
- Relative times: `ago()` returns "just now", "{m} min ago", "{h} hr ago" / "{h} hrs ago" (under 24h), else "{d}d ago". Sync label refreshed every 30s.
- Date format: `Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short'})`.
- The comment "One ticker for every countdown" in the script has no code under it (a removed feature).
- Demo mode: when `feed.demo` is true all timestamps are shifted by `Date.now() - Date.parse(generatedAt)` so the demo always looks fresh.

### 4.4 Filters
Trending (`data-trf`): single-select categories present among trending coupons.
Deals (`data-dlf`): single-select by source store.
Bank (`data-bk`): single-select by bank, "All" default.
Today tabs (`data-tab`): single-select category; selection persists in localStorage `clipupp:tab`; selecting a tab clears any store filter; the category rail's `aria-pressed` mirrors the selected tab.
Store filter: set by any `data-store` click, shown as a removable chip in the tools row; category tab is forced to All.
Sort: select as in 2.9, applied after filtering.

### 4.5 Rails
All rails are native scroll-snap (`scroll-snap-type:x mandatory`, start alignment, `overscroll-behavior-x:contain`, hidden scrollbars). Arrow buttons (desktop only) scroll programmatically; no dots except the spotlight. Spotlight uses `scroll-snap-stop:always`.

### 4.6 Lowest in 30 days
Boolean `lowest30d` on a deal renders the green text "Lowest price in 30 days" below the price. No price-history data is used.

### 4.7 Claimed %
`claimed` (number, e.g. 72) exists on every deal in `feed.json` and is copied into the normalised deal, but no markup or CSS renders it. There is no "claimed" bar in this version.

### 4.8 Diwali days (`diya`, `diwali-days`)
The strip shows a diya icon and `#diwali-days`. Script: target date `new Date(2026,10,8)` (8 Nov 2026, month index 10), today at local midnight, `k = round((target - today)/864e5)`. Text: `k > 1` "Diwali in {k} days"; `k === 1` "Diwali is tomorrow"; `k === 0` "Happy Diwali!"; else (past) "Festive season". Hard-coded, computed once at load, no feed field.

### 4.9 Other interactions
Count-up: `#count` animates 0 to `verifiedToday` over 900ms with cubic ease-out, once per page load (skipped on reduced motion).
Stagger reveal: `.fx` CSS entrance in hero; `rise` on lists after render.
Bottom nav tracking: IntersectionObserver (`rootMargin:-40% 0 -55% 0`) on `#top`, `#deals`, `#today`, `#stores` toggles `.on`.
Vibration: 12ms `navigator.vibrate` on save, reveal, bell, form success, copy.
Footer columns: `<details>` forced open on desktop and re-synced on breakpoint change.
Breakpoint change: closes mega menu, re-renders stores, clears header collapse.
Resize across 1000px re-renders the Top stores count.

### 4.10 Loading, refresh and error states
Boot: render from localStorage cache (`clipupp:feed:v1`) instantly if present; then fetch `CONFIG.feedUrl` (`cache:'no-cache'`, 8s abort timeout, `Accept: application/json`); refresh every 5 minutes while the tab is visible and on `visibilitychange` if older than 5 minutes; manual refresh button shows toast "Coupons up to date" on success.
Sync label: "Updating…" before data, then "Updated {ago}".
Error (`#feed-err`, amber `.err` bar with refresh icon): if data exists "Showing saved coupons. We couldn’t reach the server." else "We couldn’t load coupons. Check your connection."; "Try again" button (`#retry`) re-runs the load. Cleared on next success.
If neither network nor cache works, skeletons stay in place and the error bar shows.
Per-block empty states: deals ("No live deals right now. Check back in a bit."), today list (2.9), saved (3.5), search ("No match for ..."). Other rails render nothing.
Deal images that fail to load are removed so the tinted category-icon placeholder shows.

## 5. Data contract

### 5.1 `CONFIG`
`feedUrl:'data/feed.json'` (comment says point it at the backend, e.g. `/api/v1/home`).
`refreshMs:300000`.
`timeoutMs:8000`.
`cacheKey:'feed:v1'` (stored as `clipupp:feed:v1` with `{t, raw}`).
`pageSize:10`.
localStorage keys (prefix `clipupp:`): `feed:v1`, `saved`, `revealed`, `bells`, `recent`, `tab`, `theme`, `strip-x`.

### 5.2 `feed.json` schema (as consumed)
Top level: `version` (1, unused), `demo` (boolean; when true shifts all timestamps), `generatedAt` (ISO string; `D.at`, the sync label baseline, and demo shift base).
`stats` (object): `verifiedToday` (int, 2418 in demo; hero count-up, verify band, ticker no); `successRate7d` (int percent, 97; hero, verify, search none); `storeCount` (int, 512; hero "N+", stores eyebrow, footer).
`categories[]` (12 in demo: festive, fashion, electronics, food, travel, grocery, beauty, recharge, health, ott, home, marketplace): `id` (string), `name` (string), `icon` (sprite id: diya, shirt, phone, food, plane, cart, sparkle, bolt, pill, play, sofa, store), `hot` (bool, only festive). Used by: category rail, mega menu, tabs, trending chips, store category names, footer.
`stores[]` (24 in demo): `id` (string), `name`, `logo` (path, 14 of 24; otherwise falls back to a monogram tile), `mono` (2-3 letter monogram), `bg`, `fg` (monogram colours; `fg` only on one), `cat` (category id), `url` (store homepage, used for outbound link), `coupons` (int count shown, e.g. 67), `best` (string deal label, e.g. "Up to 7% extra"; desktop store tile), `popular` (int rank 1-14, optional; drives hero chips, popular strip, search defaults, store sort, footer links). Used by: hero chips, popular strip, stores grid, search, footer, logo helper everywhere, coupon store lookup.
`spotlight[]` (3): `store`, `kicker`, `flag`, `title`, `text`, `perks[]` (strings), `endsAt` (ISO), `couponId` (coupon id to open). Used by the hero carousel.
`coupons[]` (28): `id` (string, e.g. "c1"), `store` (store id), `title`, `terms`, `code` (string or missing/empty for no-code deals; 3 of 28 are codeless), `badge` (short discount label such as "12%" or "₹500"), `verifiedAt` (ISO), `success` (int percent), `uses` (int count), `exclusive` (bool, optional), `trending` (int rank, optional, 8 in demo), `expiresAt` (ISO, optional). The script adds `cat` from the store's `cat`. Coupons whose store id is unknown are dropped. Used by: ticker, trending, today list, sheet, saved, search, mega menu.
`deals[]` (6): `source` (store id), `cat` (category id for placeholder tint and icon), `endsAt` (ISO), `claimed` (int percent, unused in UI), `lowest30d` (bool, optional), plus either `raw` (partner payload) or the generic fields `store, title, price, mrp, url, rating, reviews` (and optional `image`). Demo has 5 raw (Amazon PA-API-style and Flipkart-style) and 1 generic (Myntra).
`bankOffers[]` (8): `bank` (string; HDFC Bank x2, SBI Card, Axis Bank, ICICI Bank x2, Kotak, RBL Bank), `art` (two hex colours for the card gradient), `store` (store id), `title`, `terms`.
`sales[]` (5): `id` (s1-s5), `store`, `name`, `startAt`, `endAt` (ISO), `text`.

### 5.3 Adapters (`ADAPTERS`) for raw partner items
Items in `deals[]` may be `{source, raw, cat, endsAt, claimed, lowest30d}`; the adapter is picked by `source` when `raw` exists, otherwise `generic`.
`amazon`: reads Amazon Product Advertising API 5.0 `GetItems`/`SearchItems` item: `ASIN` (id `amz-{ASIN}`), `ItemInfo.Title.DisplayValue` (title), `Offers.Listings[0].Price.Amount` (price), `Offers.Listings[0].SavingBasis.Amount` (mrp, falls back to price), `Images.Primary.Large.URL` (image), `DetailPageURL` (url), `CustomerReviews.StarRating.Value` (rating), `CustomerReviews.Count` (reviews). `DeliveryInfo.IsPrimeEligible` is present in demo data but ignored. Store forced to `amazon`.
`flipkart`: reads Flipkart Affiliate API `productBaseInfoV1`: `productId` (id `fk-{id}`), `title`, `flipkartSpecialPrice` or `flipkartSellingPrice` `.amount` (price), `maximumRetailPrice.amount` (mrp), `imageUrls['400x400']` or `['200x200']` (image), `productUrl` (url). No rating. Store forced to `flipkart`.
`generic`: already-normalised `{store|source, id, title, price, mrp, image, url, rating, reviews}`; id defaults to `{source}-{title}`.
Derived: `off = round((1 - price/mrp)*100)` when `mrp > price`, else 0. Filter drops items lacking title, a positive price or a known store.
Design intent (script header comment): a backend calls Amazon, Flipkart and affiliate APIs with secret keys and returns the same JSON shape (suggested `/api/v1/home`); the browser must never hold partner keys.

## 6. Copy inventory (not data-driven), by section

Meta: title "Clipupp"; description "Verified coupon codes, live deals and bank offers for Amazon, Flipkart, Myntra, Swiggy and 500+ Indian stores. Every code tested daily."; theme-color `#7c2ae8`.
Skip link: "Skip to content".
Strip: "Festive season" (default), " · Bank offers live", "See offers", aria "Dismiss announcement".
Header: aria "Clipupp home", "Categories", "Stores", aria "Switch colour theme" / "Switch to light theme" / "Switch to dark theme", aria "Saved coupons", aria "Deal alerts", aria "Search stores and coupons" (input), aria "Clear search", placeholder "Search Myntra, Swiggy, bank offers…". Mega: "Shop by category", "All coupons", "Sale calendar and bank offers".
Hero: "Coupons tested by people, every day"; "Codes that actually work at Indian stores."; "Every code is applied at a real checkout before it reaches you. Copy it, paste it, pay less."; placeholder "Try Myntra, Swiggy or ‘HDFC’"; "Find codes"; "codes verified today"; "worked last 7 days"; "Indian stores"; "Popular"; aria "Festive spotlight offers", "Choose offer", "Previous offer", "Next offer"; "Get this offer"; "Offer till {date}".
Ticker: "Live", "✓ verified {ago}", aria "Recently verified coupons".
Trending: "Most copied in the last hour", "Trending coupons", "All" (chip), aria "Filter trending coupons", "Scroll left", "Scroll right".
Cards: "Verified {ago}", "Exclusive", "Ends today", "{n}% success", "{n} used", "Show code", "Get deal", "Save {Store} coupon", "Show code for {Store}".
Deals: "Live price drops", "Deals from Amazon, Flipkart and more", "All deals", "{n}% off", "Lowest price in 30 days", "Buy on {Store}", "No live deals right now. Check back in a bit.", aria "Filter deals by store", "Live deals".
Today: "All coupons", "Today’s top coupons", "Updating…", "Updated {ago}", "Refresh coupons", "Loading coupons", "{n} coupon(s)", sort labels "Most used", "Best success rate", "Recently verified", "Ending soon", "Show more coupons", "No coupons here yet.", "Try another category, or turn on alerts and we’ll tell you when one lands.", "Turn on alerts", "off" / "deal" captions, aria "Coupon categories".
Errors: "Showing saved coupons. We couldn’t reach the server.", "We couldn’t load coupons. Check your connection.", "Try again".
Bank: "Stack with any coupon", "Bank and card offers", "Applied when you pay, on top of the code you copy here.", "On {Store}", aria "Filter by bank".
Calendar: "Plan your cart", "Festive sale calendar", "Tap Remind me and we’ll tell you the morning a sale opens.", "Live now", "Coming up", "Ended", "See {Store} codes", "Remind me", "Reminder set", "{d} to {d}".
Stores: "{n} stores", "Top stores", "{n} coupons", "All stores", "{n} listed".
Verify: all copy in 2.13.
Alerts: all copy in 2.14 and error/success messages in 3.6.
FAQ (verbatim):
1. Q "How do I use a coupon code from Clipupp?" A "Tap Show code. We copy the code for you. Open the store, add items to your cart, paste the code in the coupon or promo box at checkout, and the discount applies before you pay."
2. Q "Why did my code not work?" A "Most failures come from the minimum order value, a category exclusion, or a code meant for new users. Each coupon lists its conditions. If it still fails, tap No under “Did this code work?” and we re-check it within the hour."
3. Q "Can I use a coupon and a bank offer together?" A "Usually yes. Store coupons reduce the cart price, and bank offers apply when you pay with an eligible card. The bank offers section shows which banks stack with each store."
4. Q "Are the Amazon and Flipkart prices live?" A "Deal prices come from the stores’ own product feeds and refresh every few minutes. The final price is always the one shown at the store’s checkout."
5. Q "Is Clipupp free?" A "Yes. There is no sign-up, wallet or fee. We earn a commission from some stores when you shop through our links. It never changes your price."
FAQ heading block: "Help", "Questions shoppers ask", "Still stuck? Write to help@clipupp.in and a person replies within a day."
Sheet: "Categories", "{n} verified coupons", "Saved coupons", "{n} saved on this device", "Nothing saved yet.", "Tap the heart on any coupon to keep it here.", "Copy", "Copied", "No code needed. The price drops at the store.", "Copy code and open {Store}", "Shop now on {Store}", "Copy the code above.", "Add items to your {Store} cart and go to checkout.", "Paste it in the coupon box and tap Apply.", "Did this code work?", "Did this deal work?", "Yes", "No", "See all {n} {Store} coupons", "{n} coupons · {Category}", "Close", "Clear store filter {Store}".
Footer (verbatim): trust lines as in 3.8; headings "Top stores", "Categories", "Clipupp", "Help and legal"; links as in 3.8; "Run an online store?", "List your coupons on Clipupp and reach shoppers who are ready to buy.", "partners@clipupp.in", "Copy email", "Popular searches", "Get daily codes on WhatsApp", "English", "हिन्दी", "Back to top", "© 2026 Clipupp · Made in India".
Popular searches (static, all to `#today`): Myntra coupons, Swiggy promo code, Zomato offers, Flipkart Big Billion Days, Amazon Great Indian Festival, Nykaa offers, Ajio coupons, MakeMyTrip flight offers, Domino’s coupon, Blinkit first order, Croma laptop offers, Lenskart BOGO, Apollo Pharmacy coupons, Paytm recharge offers, HDFC credit card offers, Diwali sale 2026.
Legal/disclosure line (verbatim): "Clipupp is free to use. When you shop through a store link we may earn a commission from the store. It never changes the price you pay or which codes we show. Product prices come from store feeds and can change at checkout. Store names and logos belong to their owners."
Bottom nav labels: "Home", "Deals", "Coupons", "Stores", "Saved".
Note on copy conflicts with project rules: the design says "Show code" (matches existing), uses "Buy on {Store}" and product prices (not coupons-only), a WhatsApp daily alert, "cashback" appears nowhere.

## 7. Gap analysis vs what exists (branch New-design-v1)

Existing on branch: AnnouncementBar, HeroSection (+HeroSearch autosuggest with `/search`, ProofCount, CouponFan), TrendingCouponsRail, TopStoresGrid, TabbedCoupons (+TabSwitcher), BankOffersHub (campaign tiles + bank chips from setting), VerifyBand, NewsletterBar, Reveal; site header with search, Stores, Categories, Saved, Sign in; Footer; MobileBottomNav (Home, Stores, Categories, Saved); CookieBanner; SaveCouponButton (signed-in saved coupons).

| Block or feature | Exists | Backend data | Smallest honest backend addition |
|---|---|---|---|
| Announcement strip with Diwali countdown | partly (AnnouncementBar exists, settings-driven) | yes (site settings) | Admin-managed content: a `festival.name` and `festival.date` setting; compute days client/server side |
| Skip link, dark mode toggle, localStorage theme | no (no dark tokens in globals.css) | n/a | Client-side only; needs a full dark palette plus a pre-paint inline script to avoid flash |
| Header: wordmark, search, theme toggle, saved heart + badge, bell | partly (no theme toggle, no bell, no count badge, has Sign in) | partly (saved count only for signed-in users) | Client-side only for the toggle and bell link; badge needs local-or-account saved count |
| Header collapse on scroll (phones) | no | n/a | Client-side only |
| Category rail with icons (12 chips) | partly (hero chips exist, no persistent rail under the header) | yes (category slug, title, icon, parent) | None; add a `hot` flag via admin or treat a campaign as the "Festive" chip |
| Category mega menu with top-3 stores per category | partly (Categories dropdown exists) | partly (needs top stores per category) | Query: top stores by popularity per category in the layout payload |
| Hero copy, search, trust row | partly (different H1 and proof line) | partly: verifiedLast7d, activeCoupons, activeStores exist; NO success rate | Replace "97% worked last 7 days" with an honest stat (active coupons) or add a verification-result log table |
| Spotlight carousel (3 slides, perks, endsAt, couponId) | no | partly (campaign: name, heroTitle, heroSubtitle, ctaLabel, themeColor, endsAt, pinned coupons; no perks list or flag) | Could be admin-managed content: campaign `perks` text[] and `flag` field, link `couponId` to the first pinned coupon |
| Live verification ticker | no | partly (coupon verifiedAt, title, store exist) | None: latest 10 verified coupons in the layout payload |
| Popular stores strip | partly (TopStoresGrid only; no round logo strip) | yes (store popularityScore, logoUrl) | None |
| Trending coupons rail with category filter chips | yes/partly (rail exists, no filter chips, no `uses` display on card in design format) | yes (usedCount, popularityScore, categories, exclusive, verifiedAt) | None; chips use the coupon's categories |
| Per-card "% success" meta | no | no: NO success-rate data | Honest minimum: drop it, or log verification results (`coupon_check` table with passed/failed) and compute a rate |
| Store product Deals rail (Amazon/Flipkart price cards, rating, mrp, 30-day low) | no | no: NO deals feed from partners, no price history | Needs a new partner feed integration (Amazon PA-API, Flipkart Affiliate) behind a backend `deals` endpoint with an adapter layer; 30-day low needs a price-history table; this also conflicts with the coupons-only Phase 1 scope |
| "Claimed %" on deals | no (not even rendered in design) | no | Omit |
| Today's top coupons: tabs, count, sort, paging, store filter | partly (tabs and rows exist, preloaded 4 per tab; no sort, no infinite paging, no store filter, no counts) | yes (public coupons endpoint is cursor-paged with sort by popularity/verifiedAt/expiresAt; per-category counts missing) | Add per-category counts to the layout payload; "Best success rate" sort has no data (drop it) |
| Coupon sheet / dialog (detail, copy, how-to) | partly (ShowCodeButton reveals and copies, opens /r/{id}; no sheet) | yes (code, description, expiresAt, usedCount) | None |
| "Did this code work?" feedback | no | no | Needs a small `coupon_feedback` table + POST endpoint (design only shows local text); two "No" reports trigger re-check is a back-office process |
| Reveal state persistence | no | n/a | Client-side only (localStorage) |
| Saved coupons | yes for signed-in users (/account/saved-coupons, SaveCouponButton) | yes | Design saves anonymously in localStorage; add local fallback and merge-on-login, or keep sign-in required |
| Bank and card offers (per-bank cards with title, terms, store, gradient) | partly (BankOffersHub shows 2 campaign tiles + bank chips) | no: NO per-bank offer entity | New `bank_offer` entity (bank, storeId, title, terms, artColors, validity) with admin CRUD; or admin-managed content under a single setting JSON |
| Festive sale calendar with live/soon/ended and reminders | no | no: NO sale calendar entity (campaigns have startsAt/endsAt and could stand in) | Reuse campaigns as sale events (add `storeId`, `summary`); reminders need `sale_reminder` subscriptions and a job; otherwise ship without Remind me |
| Top stores grid (12, 7 + "All stores" on mobile, `best` label) | yes/partly (6x2, mobile 8; no "All stores" tile expand) | yes (activeCouponCount, cashbackRate as deal label) | None |
| How we verify band + stats | yes/partly (copy differs, no 3 stats) | partly (verifiedLast7d, activeCoupons; no success rate, no "<1 hr" metric) | Static copy; avoid unsupported numbers |
| Deal alerts: WhatsApp number form | no | no | Needs WhatsApp Business integration, a consent record and `alert_subscription` table; or omit/mark "coming soon" |
| Weekly email form | yes (NewsletterBar, subscribe endpoint) | yes (newsletter email) | None |
| FAQ accordion + FAQPage JSON-LD | no (FaqSection deleted) | n/a | Could be admin-managed content (settings or legal-pages style), keep static copy in messages |
| Footer: trust row, 4 columns, partner card, popular searches cloud, disclosure, social | partly (white footer with 4 link columns; no trust row, partner card, cloud, disclosure) | partly | Admin-managed content for popular searches and social URLs (settings); partner card static; copy-email is client-side only |
| Language toggle | partly (English only label) | n/a | Design shows a stub with toast; keep current behaviour |
| Mobile bottom nav (Home, Deals, Coupons, Stores, Saved + scroll-follow active state) | partly (Home, Stores, Categories, Saved; static) | n/a | Client-side only; "Deals" depends on the deals feature |
| Sync/refresh bar and 5-minute polling, offline cache | no | n/a | Client-side only; better: rely on cached server render + revalidate, drop the polling |
| Toasts | partly | n/a | Client-side only |
| Search suggestions (stores + coupons + deals + recent, bank intent) | partly (3 rows autosuggest via /search) | partly (search covers stores/coupons; no deals or bank offers) | Extend search response with `kind`; recent searches are localStorage-only |

## 8. Mobile behaviour

Below 640px: single-column layout; gutter 16px; h1 28px; hero shows copy then spotlight; hero search hidden (header search row is used); trust row is a 3-cell card grid; spotlight slides are 88% width with swipe and dots, no arrows; rails show a peek of the next card (trending 80%, deals 46%, bank 76%, calendar 72%) and arrows are hidden; Today rows are one column, reveal button full width under the row; Top stores is a 4-column grid with 7 tiles + "All stores" and no deal label; mega menu opens as a bottom sheet (2 columns); footer columns are collapsible `<details>` (2-column link lists); alert cards stack; forms stack.
640px to 999px: gutter 24px; h1 40px; spotlight 70%; trending 46%, deals 30%, bank 44%, calendar 40%; rows 2 columns; stores 6 columns; alerts 2 columns; footer trust row 3 columns; mega menu 3 columns; still no desktop nav, hero search hidden, bottom nav and two-row header remain.
1000px and up: bottom nav hidden; body padding-bottom 0; single-row header with centred search and "Stores" link and Categories label; hero search visible; spotlight shows one slide with arrows; rails get arrows and fixed column counts (trending 4, deals 6, bank 4, calendar 5); store grid 12 tiles with deal label; footer always open with 5 columns; dialogs centre as 480px modals.
Phone-only behaviour: header row 1 collapses on scroll-down (see 3.1); tabs bar is sticky below the header; bottom nav fixed with safe-area padding (grid of 5, 52px min height, active section follows scroll); toast sits above the nav; sheets drag to dismiss; `viewport-fit=cover` plus `env(safe-area-inset-*)` on `:root`, header, nav and sheets; `touch-action:manipulation` on buttons; 16px inputs to avoid iOS zoom; vibration feedback.
Hover-only effects (card lift, cover widen) are scoped to 1000px+.

## 9. Accessibility and SEO notes in the design

Skip link to `#main`; landmarks: `<header>`, `<nav aria-label="Categories">`, `<nav aria-label="Primary">`, `<main id="main">`, `<footer>`, `<nav aria-label="Quick navigation">`, `<nav class="cloud" aria-labelledby>`. Note: two navs share the label-less name pattern ("Categories" appears on both the rail nav and the button).
Sections use `aria-labelledby` pointing at their H2; the alerts H2 is visually hidden; the Popular stores strip uses `aria-label`.
Heading order: single H1 in hero; H2 per section; H3 for card titles and alert titles (cards inside rails; sheet title H2). Footer "Popular searches" is an H2 inside the footer (not a section of the page body).
Combobox pattern on both search inputs (`role=combobox`, `aria-expanded`, `aria-controls`, `aria-autocomplete=list`), listbox/option roles with `aria-selected`; but there is no `aria-activedescendant`, so screen readers do not hear the arrow-key selection.
Tabs: `role=tablist/tab/tabpanel`, `aria-selected`, roving `tabindex`, arrow-key navigation; the single `tabpanel` has `aria-labelledby="td-h"` (the section heading, not the tab) and tabs lack `aria-controls`.
Spotlight: `aria-roledescription=carousel/slide`, slide groups labelled "i of n", dots use `role=tab` in a `tablist`; auto-advance stops on interaction, hover, hidden tab, reduced motion (no pause button).
Toast and form messages use `aria-live=polite`; toast `role=status`.
Dialog: native `<dialog>` with `showModal`, `aria-labelledby="dlg-title"`, focus restored to the opener, Escape closes (native), close button labelled.
Buttons and chips use `aria-pressed`; save heart has per-store label; reveal button has a state-specific `aria-label`; decorative SVGs have `aria-hidden`; ticker duplicate is `aria-hidden`; card art `aria-hidden`; dots, perforations `aria-hidden`.
Colour contrast: brand `#7c2ae8` on white and `--ink-3` `#77717f` on white are close to 4.5:1 and should be checked (ink-3 on tint backgrounds and 11px text especially).
Reduced motion honoured in CSS and JS.
Images: logos `alt=""` (decorative, adjacent to the name text); deal images `alt=""`; width/height set on logos; `loading=lazy`, `decoding=async`; `<img>` for the header mark `fetchpriority=high`.
SEO: `<title>Clipupp</title>` (weak), meta description (coupons across Indian stores), `theme-color`, `format-detection`, `preload` of `data/feed.json`, `preconnect` for Google Fonts. No canonical, Open Graph or Twitter tags, no `lang` attribute on `<html>` (the `<html>` element has none), no `WebSite`/`Organization`/`Offer`/`Coupon` JSON-LD. The only structured data is `FAQPage` JSON-LD, appended to the body at runtime from the FAQ array (JS-generated; crawlers must execute JS to see it, so it should be server-rendered in Next.js).
All content is client-rendered from the feed (no SSR/no-JS content): every list block, the FAQ and the footer link lists depend on JS, which the Next.js implementation must server-render.
Outbound affiliate links use `rel="noopener sponsored nofollow"`; footer social links use `rel="noopener"` only.
The document has no cookie or consent UI; the design uses localStorage for non-essential state (saved, recent, theme) without notice.
The `/` shortcut focuses search; Escape closes the mega menu and suggestions.
Known inconsistencies worth fixing while implementing: `:root` carries `padding-top/bottom: env(safe-area-inset-*)` on `html` in the first style block while the second style block also offsets sticky top with `--safe-t` (double counting risk); `role=tab` used for non-tab dots; `.bump` keyframe unused; first `<style>` block (before `<title>`) is a tiny reset (body 14px system font, margin 0) overridden by the second.
