import { describe, expect, it } from "vitest";
import type { FeedDeal } from "@/lib/home/feed";
import { liveDeals } from "./liveDeals";

const deal = (id: string, endsAt: string | null, store = "amazon") => ({ id, store, endsAt }) as FeedDeal;
const NOW = Date.parse("2026-10-15T12:00:00Z");
const stores = new Set(["amazon"]);

describe("liveDeals", () => {
  it("drops deals that already ended", () => {
    const out = liveDeals([deal("past", "2026-10-15T11:59:59Z"), deal("future", "2026-10-15T12:00:01Z")], stores, NOW);
    expect(out.map((d) => d.id)).toEqual(["future"]);
  });

  it("drops a deal ending exactly now", () => {
    expect(liveDeals([deal("now", "2026-10-15T12:00:00Z")], stores, NOW)).toEqual([]);
  });

  it("keeps open-ended deals, sorted after dated ones", () => {
    const out = liveDeals([deal("open", null), deal("bad", "not a date"), deal("soon", "2026-10-16T00:00:00Z")], stores, NOW);
    expect(out.map((d) => d.id)).toEqual(["soon", "open", "bad"]);
  });

  it("drops deals from unknown stores", () => {
    expect(liveDeals([deal("x", null, "ghost")], stores, NOW)).toEqual([]);
  });
});
