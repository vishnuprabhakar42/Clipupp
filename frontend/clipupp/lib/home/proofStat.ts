import type { FeedStats } from "./feed";

/** Which verification number the hero and verify band show, and how it is labelled. */
export type ProofStat = { kind: "today" | "week" | "active"; value: number };

/**
 * The verification proof number. A real today count wins when it is above
 * zero, then the 7-day count, then the active-coupon count. Null when every
 * figure is zero or missing, so no block ever says "0 codes verified".
 */
export function proofStat(stats: FeedStats): ProofStat | null {
  if (stats.verifiedToday != null && stats.verifiedToday > 0) return { kind: "today", value: stats.verifiedToday };
  if (stats.verifiedLast7d != null && stats.verifiedLast7d > 0) return { kind: "week", value: stats.verifiedLast7d };
  if (stats.activeCoupons > 0) return { kind: "active", value: stats.activeCoupons };
  return null;
}
