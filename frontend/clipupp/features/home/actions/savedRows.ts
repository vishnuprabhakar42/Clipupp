"use server";

import type { ReactNode } from "react";
import { createElement } from "react";
import { getHomeFeed } from "@/lib/home/getHomeFeed";
import { CouponCard } from "@/features/catalog/components/CouponCard";

export type SavedRow = { id: string; node: ReactNode };

/**
 * Row cards for the saved sheet. Ids that are not in the current feed are
 * dropped. Runs on the server because CouponCard is a server component.
 */
export async function loadSavedRows(ids: string[]): Promise<SavedRow[]> {
  const feed = await getHomeFeed();
  const wanted = new Set(ids.slice(0, 200));
  const stores = new Map(feed.stores.map((s) => [s.id, s]));
  const cats = new Map(feed.categories.map((c) => [c.id, c]));
  const rows: SavedRow[] = [];
  for (const coupon of feed.coupons) {
    if (!wanted.has(coupon.id)) continue;
    const store = stores.get(coupon.store);
    if (!store) continue;
    const cat = coupon.cat ? cats.get(coupon.cat) : null;
    rows.push({
      id: coupon.id,
      node: createElement(CouponCard, { coupon, store, category: cat ? { name: cat.name } : null, variant: "row" }),
    });
  }
  return rows;
}
