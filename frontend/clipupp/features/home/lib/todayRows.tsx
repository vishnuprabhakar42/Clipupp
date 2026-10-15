import type { ReactNode } from "react";
import { CouponCard } from "@/features/catalog/components/CouponCard";
import type { FeedCoupon, FeedStore, HomeFeed } from "@/lib/home/feed";

/** A coupon with its pre-rendered server card (cards are server components). */
export type RowItem = { coupon: FeedCoupon; node: ReactNode };

export function isLive(c: FeedCoupon, now = Date.now()): boolean {
  if (!c.expiresAt) return true;
  const t = Date.parse(c.expiresAt);
  return Number.isNaN(t) || t > now;
}

export function mostUsed(a: FeedCoupon, b: FeedCoupon): number {
  return b.uses - a.uses;
}

/** Render cards for coupons whose store is known; the rest are dropped. */
export function buildItems(
  coupons: FeedCoupon[],
  stores: Map<string, FeedStore>,
  feed: Pick<HomeFeed, "categories">,
  variant: "card" | "row",
  startIndex = 0,
): RowItem[] {
  const catName = new Map(feed.categories.map((c) => [c.id, c.name]));
  const out: RowItem[] = [];
  for (const coupon of coupons) {
    const store = stores.get(coupon.store);
    if (!store) continue;
    const name = coupon.cat ? catName.get(coupon.cat) : undefined;
    out.push({
      coupon,
      node: (
        <CouponCard
          key={coupon.id}
          coupon={coupon}
          store={store}
          category={name ? { name } : null}
          variant={variant}
          index={startIndex + out.length}
        />
      ),
    });
  }
  return out;
}
