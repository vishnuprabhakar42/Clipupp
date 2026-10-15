import { describe, expect, it } from "vitest";
import type { FeedDeal } from "@/lib/home/feed";
import { dealOfferSchema } from "./dealOffer";

const deal: FeedDeal = {
  id: "d1",
  store: "amazon",
  title: "X",
  price: 999,
  mrp: 1299,
  image: null,
  url: "https://a/b",
  rating: null,
  reviews: null,
  cat: "electronics",
  endsAt: "2026-12-01T00:00:00Z",
  lowest30d: false,
  off: 23,
};

describe("dealOfferSchema", () => {
  it("maps a deal to an Offer", () => {
    expect(dealOfferSchema(deal, { name: "Amazon" })).toMatchObject({
      "@type": "Offer",
      name: "X",
      price: 999,
      priceCurrency: "INR",
      url: "https://a/b",
      availability: "https://schema.org/InStock",
      priceValidUntil: "2026-12-01T00:00:00Z",
      seller: { "@type": "Organization", name: "Amazon" },
    });
  });

  it("has no undefined keys when mrp and endsAt are null", () => {
    const result = dealOfferSchema({ ...deal, mrp: null, endsAt: null }, { name: "Amazon" });
    expect(Object.values(result)).not.toContain(undefined);
    expect(result).not.toHaveProperty("priceValidUntil");
  });
});
