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
    expect(feed.stats).toEqual({ verifiedToday: 40, successRate7d: null, storeCount: 44, activeCoupons: 132 });
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
        store: "big-sale",
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

  it("falls back to the fixture section order when the backend order lacks a code", () => {
    const demo = toHomeFeed(layout(), {}, { demo: true, now: NOW });
    expect(demo.sectionOrder).toEqual(fixture.sectionOrder);
    const real = toHomeFeed(layout(), {}, { demo: false, now: NOW });
    expect(real.sectionOrder).not.toEqual(fixture.sectionOrder);
  });

  it("returns an empty feed for a null layout with demo off", () => {
    const feed = toHomeFeed(null, {}, { demo: false, now: NOW });
    expect(feed.demo).toBe(false);
    expect(feed.coupons).toEqual([]);
    expect(feed.stores).toEqual([]);
    expect(feed.sectionOrder).toEqual([]);
    expect(feed.stats).toEqual({ verifiedToday: 0, successRate7d: null, storeCount: 0, activeCoupons: 0 });
  });
});
