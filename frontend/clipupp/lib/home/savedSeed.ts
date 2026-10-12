import type { FeedCoupon, FeedStore } from "./feed";

/** Coupon fields a saved row (`CouponRow`) renders. */
export type SeedCoupon = Pick<
  FeedCoupon,
  "id" | "slug" | "store" | "title" | "terms" | "code" | "badge" | "verifiedAt" | "success" | "uses" | "exclusive" | "expiresAt" | "cat"
>;
/** Store fields a saved row (`StoreTile`, store line) renders. */
export type SeedStore = Pick<FeedStore, "id" | "name" | "logo" | "mono" | "bg" | "fg" | "coupons">;

/**
 * Seed contract of the saved sheet. The homepage passes its own `feed.coupons`
 * / `feed.stores` objects (structurally wider than these picks): React Flight
 * serialises an object reference once, so reusing the objects the page already
 * sends costs almost nothing, while a projected copy adds every coupon a
 * second time (measured +37 KB of HTML in dev). Other routes send no seed.
 */
export type SavedSeed = { coupons: SeedCoupon[]; stores: SeedStore[]; categories: { id: string; name: string }[] };

/** Back to the full feed shapes the row components take; fields outside the seed default to empty. */
export function expandSeedCoupon(c: SeedCoupon): FeedCoupon {
  return { trending: null, ...c };
}
export function expandSeedStore(s: SeedStore): FeedStore {
  return { cat: null, url: null, best: null, popular: null, ...s };
}
