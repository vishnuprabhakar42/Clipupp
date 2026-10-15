import type { HomeFeed } from "./feed";
import { liveDeals } from "./liveDeals";

/**
 * Homepage anchor ids, as the blocks render them (the hero wrapper is "top",
 * the rest are the blocks' own `<section id>`).
 */
export type HomeAnchor = "top" | "today" | "stores" | "deals" | "bank" | "calendar" | "verify" | "alerts" | "faq";

/** Section code -> the anchor id its block renders. */
const ANCHOR_OF: Record<string, HomeAnchor> = {
  hero_search: "top",
  top_deals: "today",
  featured_stores: "stores",
  deals: "deals",
  bank_offers: "bank",
  sale_calendar: "calendar",
  verify_band: "verify",
  alerts: "alerts",
  // Until the backend renames the row, the newsletter code renders the alerts block.
  newsletter: "alerts",
  faq: "faq",
};

/** Where a link goes when its block is not on the homepage; null hides the link. */
const FALLBACK: Record<HomeAnchor, string | null> = {
  top: "/",
  today: "/coupons",
  stores: "/stores",
  deals: "/offers",
  bank: "/offers",
  calendar: "/offers",
  verify: "/how-it-works",
  alerts: null,
  faq: null,
};

/**
 * Blocks that need data, with the same test the block uses (items whose
 * store the feed knows). Codes not listed always have content. Without data
 * these render nothing, except the coming-soon blocks (see `comingSoon`).
 */
const HAS_CONTENT: Record<string, (feed: HomeFeed) => boolean> = {
  deals: (f) => liveDeals(f.deals, new Set(f.stores.map((s) => s.id))).length > 0,
  bank_offers: (f) => f.bankOffers.some((o) => knows(f, o.store)),
  sale_calendar: (f) => f.sales.some((s) => knows(f, s.store)),
  featured_stores: (f) => f.stores.length > 0,
  faq: (f) => f.faq.length > 0,
};

function knows(feed: HomeFeed, store: string): boolean {
  return feed.stores.some((s) => s.id === store);
}

/** Blocks that show a "coming soon" tile instead of nothing when production has no rows. */
const TILE_CODES = new Set(["deals", "bank_offers", "sale_calendar"]);

function hasContent(code: string, feed: HomeFeed): boolean {
  return HAS_CONTENT[code]?.(feed) ?? true;
}

/**
 * True when the block for `code` renders its coming-soon tile: a deals, bank
 * or calendar block with no rows outside demo mode (the demo feed fills
 * them, so an empty one there is a fixture gap, not a launch state).
 */
export function comingSoon(code: string, feed: HomeFeed): boolean {
  return TILE_CODES.has(code) && !feed.demo && !hasContent(code, feed);
}

/** True when the block for `code` renders anything: its content or its coming-soon tile. */
export function sectionRenders(code: string, feed: HomeFeed): boolean {
  return hasContent(code, feed) || comingSoon(code, feed);
}

/**
 * Anchor ids present on the rendered homepage with real content. A
 * coming-soon tile is on the page but is not a link target: links to deals,
 * bank or calendar go to the route that holds that content instead.
 */
export function renderedAnchors(feed: HomeFeed): HomeAnchor[] {
  const out = new Set<HomeAnchor>();
  for (const code of feed.sectionOrder) {
    const id = ANCHOR_OF[code];
    if (id && hasContent(code, feed)) out.add(id);
  }
  return [...out];
}

/**
 * Link target for a homepage block: "/#id" when the block renders, else the
 * route that holds the same content, or null when there is none (hide the
 * link). The path is locale-free; the i18n `Link` and router add the prefix.
 */
export function anchorFor(id: HomeAnchor, rendered: readonly string[]): string | null {
  return rendered.includes(id) ? `/#${id}` : FALLBACK[id];
}
