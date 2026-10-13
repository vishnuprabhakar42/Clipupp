import { describe, expect, it } from "vitest";
import type { FeedStore, HomeFeed } from "./feed";
import { anchorFor, renderedAnchors, sectionRenders } from "./anchors";

const store = { id: "flipkart" } as FeedStore;

const feed = (over: Partial<HomeFeed> = {}): HomeFeed =>
  ({
    stores: [store],
    deals: [],
    bankOffers: [],
    sales: [],
    faq: [],
    sectionOrder: [],
    ...over,
  }) as HomeFeed;

describe("renderedAnchors", () => {
  it("maps the production order to the blocks that render", () => {
    const f = feed({
      sectionOrder: ["hero_search", "trending_coupons", "featured_stores", "top_deals", "bank_offers", "verify_band", "newsletter"],
    });
    // bank_offers is in the order but has no offers, so it is not an anchor.
    expect(renderedAnchors(f)).toEqual(["top", "stores", "today", "verify", "alerts"]);
  });

  it("counts a data block only when an item's store is known", () => {
    const order = ["deals", "bank_offers", "sale_calendar", "faq"];
    expect(renderedAnchors(feed({ sectionOrder: order, deals: [{ store: "nowhere" }] as HomeFeed["deals"] }))).toEqual([]);
    const full = feed({
      sectionOrder: order,
      deals: [{ store: "flipkart" }] as HomeFeed["deals"],
      bankOffers: [{ store: "flipkart" }] as HomeFeed["bankOffers"],
      sales: [{ store: "flipkart" }] as HomeFeed["sales"],
      faq: [{ q: "q", a: "a" }],
    });
    expect(renderedAnchors(full)).toEqual(["deals", "bank", "calendar", "faq"]);
  });

  it("is empty when the feed has no order", () => {
    expect(renderedAnchors(feed())).toEqual([]);
  });
});

describe("sectionRenders", () => {
  it("treats blocks without a data test as always rendering", () => {
    expect(sectionRenders("verify_band", feed())).toBe(true);
    expect(sectionRenders("featured_stores", feed({ stores: [] }))).toBe(false);
  });
});

describe("anchorFor", () => {
  it("links in-page when the block renders", () => {
    expect(anchorFor("bank", ["bank"])).toBe("/#bank");
  });
  it("falls back to the route that holds the content", () => {
    expect(anchorFor("deals", [])).toBe("/offers");
    expect(anchorFor("bank", [])).toBe("/offers");
    expect(anchorFor("calendar", [])).toBe("/offers");
    expect(anchorFor("today", [])).toBe("/coupons");
  });
  it("hides links whose block has no route of its own", () => {
    expect(anchorFor("faq", [])).toBeNull();
    expect(anchorFor("alerts", [])).toBeNull();
  });
});
