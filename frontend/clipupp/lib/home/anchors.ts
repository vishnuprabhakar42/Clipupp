import type { HomeFeed } from "./feed";

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
 * Blocks that render null without data, with the same test the block uses
 * (items whose store the feed knows). Codes not listed always render.
 */
const HAS_CONTENT: Record<string, (feed: HomeFeed) => boolean> = {
  deals: (f) => f.deals.some((d) => knows(f, d.store)),
  bank_offers: (f) => f.bankOffers.some((o) => knows(f, o.store)),
  sale_calendar: (f) => f.sales.some((s) => knows(f, s.store)),
  featured_stores: (f) => f.stores.length > 0,
  faq: (f) => f.faq.length > 0,
};

function knows(feed: HomeFeed, store: string): boolean {
  return feed.stores.some((s) => s.id === store);
}

/** True when the block for `code` has something to render. */
export function sectionRenders(code: string, feed: HomeFeed): boolean {
  return HAS_CONTENT[code]?.(feed) ?? true;
}

/** Anchor ids present on the rendered homepage, from the section codes that actually render. */
export function renderedAnchors(feed: HomeFeed): HomeAnchor[] {
  const out = new Set<HomeAnchor>();
  for (const code of feed.sectionOrder) {
    const id = ANCHOR_OF[code];
    if (id && sectionRenders(code, feed)) out.add(id);
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
