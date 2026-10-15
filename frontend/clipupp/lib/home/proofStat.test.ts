import { describe, expect, it } from "vitest";
import type { FeedStats } from "./feed";
import { proofStat } from "./proofStat";

const stats = (over: Partial<FeedStats> = {}): FeedStats => ({
  verifiedToday: null,
  verifiedLast7d: null,
  successRate7d: null,
  storeCount: 44,
  activeCoupons: 132,
  ...over,
});

describe("proofStat", () => {
  it("uses a real today count above zero", () => {
    expect(proofStat(stats({ verifiedToday: 12, verifiedLast7d: 80 }))).toEqual({ kind: "today", value: 12 });
  });
  it("falls back to the 7-day count when today is null or zero", () => {
    expect(proofStat(stats({ verifiedLast7d: 40 }))).toEqual({ kind: "week", value: 40 });
    expect(proofStat(stats({ verifiedToday: 0, verifiedLast7d: 40 }))).toEqual({ kind: "week", value: 40 });
  });
  it("falls back to the active-coupon count when nothing was verified", () => {
    expect(proofStat(stats({ verifiedToday: 0, verifiedLast7d: 0 }))).toEqual({ kind: "active", value: 132 });
  });
  it("is null when every figure is zero", () => {
    expect(proofStat(stats({ verifiedLast7d: 0, activeCoupons: 0 }))).toBeNull();
  });
});
