import type { FeedCoupon } from "@/lib/home/feed";

export type Sort = "pop" | "new" | "end" | "rate";

const ts = (iso: string | null, fallback: number) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? fallback : t;
};

/**
 * Sort loaded coupons client side (the list endpoints have no sort param).
 * "pop" keeps load order, which is the backend popularity order, so appended
 * pages never reshuffle what is already on screen.
 */
export function sortItems<T extends { coupon: FeedCoupon }>(items: T[], sort: Sort): T[] {
  if (sort === "pop") return items;
  const out = [...items];
  if (sort === "new") out.sort((a, b) => ts(b.coupon.verifiedAt, 0) - ts(a.coupon.verifiedAt, 0));
  if (sort === "end") out.sort((a, b) => ts(a.coupon.expiresAt, Infinity) - ts(b.coupon.expiresAt, Infinity));
  if (sort === "rate") out.sort((a, b) => (b.coupon.success ?? -1) - (a.coupon.success ?? -1));
  return out;
}
