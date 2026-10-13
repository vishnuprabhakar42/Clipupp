import { describe, expect, it } from "vitest";
import type {
  HomepageCouponSummary,
  HomepageLayout,
  HomepageSectionPayload,
  HomepageStoreSummary,
} from "@/lib/api/homepage";
import fixture from "@/features/home/fixtures/demo-feed.json";
import { toHomeFeed } from "./adapter";

const NOW = new Date("2026-10-12T10:00:00Z");

const coupon = (over: Partial<HomepageCouponSummary> = {}): HomepageCouponSummary => ({
  id: "k1",
  slug: "flipkart-free-shipping-3",
  storeId: "s1",
  storeName: "Flipkart",
  storeSlug: "flipkart",
  storeLogoUrl: "/brands/flipkart.png",
  storeBrandColor: "#2874F0",
  type: "FREE_SHIPPING",
  code: null,
  title: "Free Delivery on All Orders",
  description: "No minimum spend.",
  savingsLabel: "Free shipping",
  expiresAt: null,
  verified: true,
  verifiedAt: "2026-10-12T09:00:00Z",
  exclusive: false,
  usedCount: 276,
  popularityScore: 79,
  categorySlugs: ["fashion", "electronics"],
  ...over,
});

const store = (over: Partial<HomepageStoreSummary> = {}): HomepageStoreSummary => ({
  id: "s1",
  slug: "flipkart",
  name: "Flipkart",
  logoUrl: "/brands/flipkart.png",
  shortDescription: null,
  rating: null,
  reviewCount: 0,
  countryCode: "IN",
  popularityScore: 1,
  brandColor: "#2874F0",
  cashbackRate: "Up to 6% extra",
  previousCashbackRate: null,
  tagline: null,
  featured: true,
  activeCouponCount: 12,
  ...over,
});

const section = (code: string, over: Partial<HomepageSectionPayload> = {}): HomepageSectionPayload => ({
  code,
  title: code,
  subtitle: null,
  itemLimit: null,
  stores: null,
  coupons: null,
  categories: null,
  categoryTabs: null,
  campaigns: null,
  ...over,
});

const layout = (): HomepageLayout => ({
  stats: { verifiedLast7d: 40, activeCoupons: 132, activeStores: 44 },
  sections: [
    section("hero_search", {
      coupons: [coupon({ id: "k1" })],
      categories: [
        { slug: "fashion", title: "Fashion", icon: "shirt" },
        { slug: "electronics", title: "Electronics", icon: "cpu" },
      ],
    }),
    section("trending_coupons", {
      coupons: [
        coupon({ id: "k2", savingsLabel: "Save up to 12% extra", code: "SAVE12", categorySlugs: ["fashion"] }),
        coupon({ id: "k1" }),
      ],
    }),
    section("featured_stores", {
      stores: [store(), store({ id: "s2", slug: "myntra", name: "Myntra", brandColor: null, cashbackRate: null, activeCouponCount: null })],
    }),
    section("top_deals", {
      categoryTabs: [{ slug: "fashion", title: "Fashion", coupons: [coupon({ id: "k3", categorySlugs: ["beauty"] })] }],
    }),
    section("bank_offers", {
      campaigns: [
        {
          id: "c1",
          slug: "big-sale",
          name: "Big Sale",
          description: null,
          startsAt: "2026-10-01T00:00:00Z",
          endsAt: "2026-10-20T00:00:00Z",
          active: true,
          heroTitle: null,
          heroSubtitle: "Extra savings",
          heroImageUrl: null,
          ctaLabel: null,
          ctaUrl: null,
          themeColor: null,
        },
      ],
    }),
    section("verify_band"),
  ],
});

describe("toHomeFeed", () => {
  it("maps a real layout with demo off", () => {
    const feed = toHomeFeed(layout(), { "bank_offers.banks": "HDFC Bank, SBI Card" }, { demo: false, now: NOW });
    expect(feed.demo).toBe(false);
    expect(feed.deals).toEqual([]);
    expect(feed.bankOffers).toEqual([]);
    expect(feed.sales).toEqual([]);
    // No today count in the payload: today stays null and the 7-day count is carried as such.
    expect(feed.stats).toEqual({ verifiedToday: null, verifiedLast7d: 40, successRate7d: null, storeCount: 44, activeCoupons: 132 });
    expect(feed.stores.slice(0, 2).map((s) => [s.id, s.coupons, s.best, s.popular, s.mono, s.bg, s.fg, s.url])).toEqual([
      ["flipkart", 12, "Up to 6% extra", 1, "FL", "#2874F0", "#fff", null],
      ["myntra", 0, null, 2, "MY", "#8529CD", "#fff", null],
    ]);
    const ids = feed.coupons.map((c) => c.id);
    expect(ids).toEqual(["k2", "k1", "k3"]);
    const k2 = feed.coupons[0];
    expect(k2.badge).toBe("12%");
    expect(k2.trending).toBe(1);
    expect(k2.success).toBeNull();
    expect(k2.cat).toBe("fashion");
    expect(k2.store).toBe("flipkart");
    expect(feed.coupons[1].badge).toBe("Deal");
    expect(feed.coupons[1].trending).toBe(2);
    expect(feed.categories.map((c) => [c.id, c.icon, c.couponCount])).toEqual([
      ["fashion", "shirt", 1],
      ["electronics", "smartphone", 0],
      ["beauty", "sparkles", 0],
    ]);
    expect(feed.categories[0].topStores).toEqual([{ slug: "flipkart", name: "Flipkart" }]);
    expect(feed.spotlight).toEqual([
      {
        store: null,
        href: null,
        kicker: "Big Sale",
        flag: "Live now",
        title: "Big Sale",
        text: "Extra savings",
        perks: [],
        endsAt: "2026-10-20T00:00:00Z",
        couponId: null,
      },
    ]);
    expect(feed.banks).toEqual(["HDFC Bank", "SBI Card"]);
    expect(feed.festival).toBeNull();
    expect(feed.faq).toEqual([]);
    expect(feed.telegramBot).toBeNull();
    expect(feed.sectionOrder).toEqual([
      "hero_search",
      "trending_coupons",
      "featured_stores",
      "top_deals",
      "bank_offers",
      "verify_band",
    ]);
  });

  it("reads festival, faq, popular searches and telegram from settings", () => {
    const feed = toHomeFeed(
      layout(),
      {
        "festival.name": "Diwali",
        "festival.date": "2026-11-08",
        "faq.items": JSON.stringify([{ q: "Q?", a: "A." }]),
        "footer.popular_searches": [{ label: "Myntra", href: "/stores/myntra" }],
        "telegram.bot_username": "clipupp_bot",
      },
      { demo: false, now: NOW },
    );
    expect(feed.festival).toEqual({ name: "Diwali", date: "2026-11-08" });
    expect(feed.faq).toEqual([{ q: "Q?", a: "A." }]);
    expect(feed.popularSearches).toEqual([{ label: "Myntra", href: "/stores/myntra" }]);
    expect(feed.telegramBot).toBe("clipupp_bot");
  });

  it("uses the shifted fixture for a null layout with demo on", () => {
    const feed = toHomeFeed(null, {}, { demo: true, now: NOW });
    expect(feed.demo).toBe(true);
    expect(feed.generatedAt).toBe(NOW.toISOString());
    expect(feed.coupons).toHaveLength(fixture.coupons.length);
    expect(feed.deals.length).toBeGreaterThan(0);
    expect(feed.stats.successRate7d).toBe(fixture.stats.successRate7d);
    // The fixture was verified `offset` before its own generatedAt; the shift keeps that offset.
    const first = fixture.coupons[0];
    const offset = Date.parse(fixture.generatedAt) - Date.parse(first.verifiedAt);
    expect(NOW.getTime() - Date.parse(feed.coupons[0].verifiedAt!)).toBe(offset);
    // The freshest coupon reads as verified within the hour.
    const freshest = Math.max(...feed.coupons.map((c) => Date.parse(c.verifiedAt!)));
    expect(NOW.getTime() - freshest).toBeLessThanOrEqual(60 * 60 * 1000);
    expect(Date.parse(feed.deals[0].endsAt!)).toBeGreaterThan(Date.parse(fixture.deals[0].endsAt) - 1);
  });

  it("keeps backend coupons and fills the rest from the fixture", () => {
    const feed = toHomeFeed(layout(), {}, { demo: true, now: NOW });
    expect(feed.demo).toBe(true);
    expect(feed.coupons.map((c) => c.id)).toEqual(["k2", "k1", "k3"]);
    expect(feed.stores[0].id).toBe("flipkart");
    expect(feed.deals).toHaveLength(fixture.deals.length);
    expect(feed.bankOffers).toHaveLength(fixture.bankOffers.length);
    expect(feed.faq).toHaveLength(5);
    expect(feed.stats.storeCount).toBe(44);
  });

  it("uses the fixture section order in full in demo mode", () => {
    const l = layout();
    l.sections.push(section("newsletter"));
    const demo = toHomeFeed(l, {}, { demo: true, now: NOW });
    expect(demo.sectionOrder).toEqual(fixture.sectionOrder);
    expect(demo.sectionOrder.indexOf("top_deals")).toBeLessThan(demo.sectionOrder.indexOf("featured_stores"));
    // Production keeps the backend codes and order untouched.
    const real = toHomeFeed(l, {}, { demo: false, now: NOW });
    expect(real.sectionOrder).toEqual(l.sections.map((s) => s.code));
    expect(real.sectionOrder).not.toContain("ticker");
  });

  it("uses the fixture order for a null layout in demo mode", () => {
    expect(toHomeFeed(null, {}, { demo: true, now: NOW }).sectionOrder).toEqual(fixture.sectionOrder);
  });

  it("maps fixture categories and stores onto backend slugs by name", () => {
    const l = layout();
    const hero = l.sections[0];
    hero.categories = [
      { slug: "fashion", title: "Fashion", icon: "shirt" },
      { slug: "food-dining", title: "Food & Dining", icon: "utensils" },
      { slug: "home-living", title: "Home & Living", icon: "sofa" },
      { slug: "groceries", title: "Groceries", icon: "shopping-basket" },
    ];
    l.sections[2].stores = [store({ id: "s9", slug: "ajio", name: "Ajio" }), store({ id: "s1", slug: "amazon-india", name: "Amazon India" })];
    const feed = toHomeFeed(l, {}, { demo: true, now: NOW });
    const catIds = feed.categories.map((c) => c.id);
    // Backend slugs stand in for the fixture ids; only unmatched fixture ids stay.
    expect(catIds).toEqual(expect.arrayContaining(["food-dining", "home-living", "groceries"]));
    expect(catIds).not.toEqual(expect.arrayContaining(["food", "home", "grocery"]));
    const fixtureOnly = feed.categories.filter((c) => c.source === "fixture").map((c) => c.id);
    expect(fixtureOnly).toEqual(expect.arrayContaining(["marketplace", "festive", "recharge"]));
    expect(feed.categories.filter((c) => c.source === "fixture").every((c) => c.parent === null)).toBe(true);
    expect(feed.categories.find((c) => c.id === "fashion")?.source).toBeUndefined();
    // Fixture deals and sales follow the mapping.
    expect(feed.deals.every((d) => d.cat !== "grocery" && d.cat !== "home")).toBe(true);
    expect(feed.deals.some((d) => d.cat === "groceries")).toBe(true);
    const ajio = feed.stores.filter((st) => st.id === "ajio");
    expect(ajio).toHaveLength(1);
    expect(ajio[0].source).toBeUndefined();
    expect(feed.sales.find((x) => x.name === fixture.sales[4].name)?.store).toBe("ajio");
    // "Amazon" (fixture) and "Amazon India" (backend) are the same store.
    expect(feed.stores.filter((st) => st.id === "amazon-india")).toHaveLength(1);
    const only = feed.stores.filter((st) => st.source === "fixture");
    expect(only.length).toBeGreaterThan(0);
    expect(only.every((st) => st.popular === null)).toBe(true);
  });

  it("names the spotlight store from the first resolvable pinned store id", () => {
    const l = layout();
    l.sections[4].campaigns![0].pinnedStoreIds = ["unknown", "s2"];
    const feed = toHomeFeed(l, {}, { demo: false, now: NOW });
    expect(feed.spotlight[0].store).toBe("myntra");
    l.sections[4].campaigns![0].pinnedStoreIds = [];
    // Never the campaign slug: no resolved store means no store.
    expect(toHomeFeed(l, {}, { demo: false, now: NOW }).spotlight[0].store).toBeNull();
  });

  it("carries the campaign link and names the store it points at when that store is known", () => {
    const l = layout();
    l.sections[4].campaigns![0].ctaUrl = "/stores/myntra";
    const slide = toHomeFeed(l, {}, { demo: false, now: NOW }).spotlight[0];
    expect(slide).toMatchObject({ store: "myntra", href: "/stores/myntra" });
    l.sections[4].campaigns![0].ctaUrl = "/stores/unknown-shop";
    expect(toHomeFeed(l, {}, { demo: false, now: NOW }).spotlight[0]).toMatchObject({ store: null, href: "/stores/unknown-shop" });
  });

  it("tops the spotlight up from the fixture only when no backend slide has perks", () => {
    const demo = toHomeFeed(layout(), {}, { demo: true, now: NOW });
    expect(demo.spotlight).toHaveLength(3);
    expect(demo.spotlight[0].kicker).toBe("Big Sale");
    expect(demo.spotlight.slice(1).every((x) => x.perks.length > 0)).toBe(true);
    expect(toHomeFeed(layout(), {}, { demo: false, now: NOW }).spotlight).toHaveLength(1);
    // Fixture slides never point at a coupon the merged feed does not carry.
    demo.spotlight.forEach((x) => expect(x.couponId === null || demo.coupons.some((c) => c.id === x.couponId)).toBe(true));
  });

  it("returns an empty feed for a null layout with demo off", () => {
    const feed = toHomeFeed(null, {}, { demo: false, now: NOW });
    expect(feed.demo).toBe(false);
    expect(feed.coupons).toEqual([]);
    expect(feed.stores).toEqual([]);
    expect(feed.sectionOrder).toEqual([]);
    expect(feed.stats).toEqual({ verifiedToday: null, verifiedLast7d: null, successRate7d: null, storeCount: 0, activeCoupons: 0 });
  });

  it("infers a leaf category's root parent from the coupons that carry it", () => {
    const l = layout();
    l.sections[1].coupons = [
      coupon({ id: "k2", categorySlugs: ["mens-clothing", "fashion"] }),
      coupon({ id: "k4", categorySlugs: ["mens-clothing", "fashion", "electronics"] }),
      coupon({ id: "k5", categorySlugs: ["gadgets", "fashion", "electronics"] }),
    ];
    const cats = toHomeFeed(l, {}, { demo: false, now: NOW }).categories;
    const byId = new Map(cats.map((c) => [c.id, c]));
    expect(byId.get("fashion")?.parent).toBeNull();
    expect(byId.get("mens-clothing")?.parent).toBe("fashion");
    // Two roots on every coupon: ambiguous, so no parent.
    expect(byId.get("gadgets")?.parent).toBeUndefined();
  });
});
