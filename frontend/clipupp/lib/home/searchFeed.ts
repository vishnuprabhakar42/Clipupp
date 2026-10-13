import type { HeaderSearchFeed } from "@/features/catalog/components/HeaderSearch";
import type { HomeFeed } from "./feed";
import { anchorFor, renderedAnchors } from "./anchors";

/** Light DTO the search suggestion engine needs, derived from the feed. */
export function toSearchFeed(feed: HomeFeed): HeaderSearchFeed {
  const storeName = new Map(feed.stores.map((s) => [s.id, s.name]));
  const rendered = renderedAnchors(feed);
  return {
    stores: feed.stores.map((s) => ({ id: s.id, name: s.name, coupons: s.coupons, popular: s.popular })),
    coupons: feed.coupons.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      code: c.code,
      storeName: storeName.get(c.store) ?? c.store,
    })),
    deals: feed.deals.map((d) => ({ id: d.id, title: d.title, price: d.price })),
    bankOfferCount: feed.bankOffers.length,
    // The bank jump only shows when the bank block is on the page; deals fall back to their route.
    bankHref: rendered.includes("bank") ? anchorFor("bank", rendered) : null,
    dealsHref: anchorFor("deals", rendered) ?? "/offers",
  };
}
