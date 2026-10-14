import { describe, expect, it } from "vitest";
import type { FeedStore, HomeFeed } from "./feed";
import { anchorFor, comingSoon, renderedAnchors, sectionRenders } from "./anchors";

const store = { id: "flipkart" } as FeedStore;

const feed = (over: Partial<HomeFeed> = {}): HomeFeed =>
  ({
    stores: [store],
    deals: [],
    bankOffers: [],
    sales: [],
    faq: [],
    sectionOrder: [],
    demo: false,
    ...over,
  }) as HomeFeed;

describe("renderedAnchors", () => {
  it("maps the production order to the blocks that render", () => {
    const f = feed({
      sectionOrder: ["hero_search", "trending_coupons", "featured_stores", "top_deals", "bank_offers", "verify_band", "newsletter"],
    });
    // bank_offers is in the order but has no offers: its coming-soon tile renders,
    // but links to bank offers go to /offers rather than to the tile.
    expect(renderedAnchors(f)).toEqual(["top", "stores", "today", "verify", "alerts"]);
  });

  it("counts a data block only when an item's store is known", () => {
    const order = ["deals", "bank_offers", "sale_calendar", "faq"];
    expect(renderedAnchors(feed({ sectionOrder: order, deals: [{ store: "nowhere" }] as HomeFeed["deals"] }))).toEqual([]);
    // Coming-soon tiles are not link targets either.
    expect(renderedAnchors(feed({ sectionOrder: order, demo: true }))).toEqual([]);
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

  it("renders deals, bank and calendar as a coming-soon tile when production has no rows", () => {
    for (const code of ["deals", "bank_offers", "sale_calendar"]) {
      expect(sectionRenders(code, feed({ demo: false }))).toBe(true);
      // Items whose store is unknown do not count; the tile still renders.
      expect(sectionRenders(code, feed({ demo: false, deals: [{ store: "nowhere" }] as HomeFeed["deals"] }))).toBe(true);
    }
  });

  it("renders nothing for an empty deals, bank or calendar block in demo mode", () => {
    for (const code of ["deals", "bank_offers", "sale_calendar"]) {
      expect(sectionRenders(code, feed({ demo: true }))).toBe(false);
    }
  });

  it("does not render an empty faq", () => {
    expect(sectionRenders("faq", feed({ demo: false }))).toBe(false);
    expect(sectionRenders("faq", feed({ faq: [{ q: "q", a: "a" }] }))).toBe(true);
  });

  it("renders bank offers that have rows", () => {
    const f = feed({ bankOffers: [{ store: "flipkart" }] as HomeFeed["bankOffers"] });
    expect(sectionRenders("bank_offers", f)).toBe(true);
    expect(sectionRenders("bank_offers", { ...f, demo: true })).toBe(true);
  });
});

describe("comingSoon", () => {
  it("is true only for a tile block with no rows outside demo mode", () => {
    expect(comingSoon("deals", feed())).toBe(true);
    expect(comingSoon("deals", feed({ demo: true }))).toBe(false);
    expect(comingSoon("deals", feed({ deals: [{ store: "flipkart" }] as HomeFeed["deals"] }))).toBe(false);
    expect(comingSoon("faq", feed())).toBe(false);
    expect(comingSoon("verify_band", feed())).toBe(false);
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
