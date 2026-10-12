import { describe, expect, it } from "vitest";
import type { FeedCoupon } from "@/lib/home/feed";
import { sortItems } from "./todaySort";

const c = (id: string, over: Partial<FeedCoupon>) => ({ coupon: { id, verifiedAt: null, expiresAt: null, success: null, uses: 0, ...over } as FeedCoupon });

describe("sortItems", () => {
  const items = [
    c("a", { expiresAt: null, verifiedAt: "2026-01-01T00:00:00Z", success: 80 }),
    c("b", { expiresAt: "2027-01-02T00:00:00Z", verifiedAt: "2026-03-01T00:00:00Z", success: 95 }),
    c("d", { expiresAt: "2027-01-01T00:00:00Z", verifiedAt: null, success: null }),
  ];
  const ids = (x: typeof items) => x.map((i) => i.coupon.id).join("");

  it("keeps load order for popularity", () => expect(ids(sortItems(items, "pop"))).toBe("abd"));
  it("ending soon puts the earliest expiry first and no-expiry last", () => expect(ids(sortItems(items, "end"))).toBe("dba"));
  it("recently verified puts newest first and unverified last", () => expect(ids(sortItems(items, "new"))).toBe("bad"));
  it("best success rate puts highest first", () => expect(ids(sortItems(items, "rate"))).toBe("bad"));
  it("does not mutate the input", () => {
    sortItems(items, "end");
    expect(ids(items)).toBe("abd");
  });
});
