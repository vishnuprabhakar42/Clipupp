import { describe, expect, it } from "vitest";
import { pickTrending, type TrendingEntry } from "./pickTrending";

const e = (id: string, cat: string, trending: number | null): TrendingEntry => ({ id, cat, trending, node: null });

describe("pickTrending", () => {
  const entries = [e("a", "x", 2), e("b", "x", 1), e("c", "y", 3), e("d", "x", null), e("f", "x", null), e("g", "y", null)];

  it("sorts trending ascending for All and skips padding when 4 or more", () => {
    const four = [...entries, e("h", "y", 4)];
    expect(pickTrending(four, "all").map((i) => i.id)).toEqual(["b", "a", "c", "h"]);
  });
  it("pads a short filter with non-trending coupons of the same category", () => {
    expect(pickTrending(entries, "x").map((i) => i.id)).toEqual(["b", "a", "d", "f"]);
  });
  it("caps at 8", () => {
    const many = Array.from({ length: 12 }, (_, i) => e(`t${i}`, "x", i + 1));
    expect(pickTrending(many, "all")).toHaveLength(8);
  });
});
