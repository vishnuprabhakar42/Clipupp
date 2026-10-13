"use server";

import type { ReactNode } from "react";
import { createElement } from "react";
import { getHomeFeed } from "@/lib/home/getHomeFeed";
import { accountFetch } from "@/lib/account/server-fetch";
import { API_BASE } from "@/lib/api/client";
import type { CouponDetail, CursorPage } from "@/lib/api/types";
import type { SavedCouponItem } from "@/lib/api/savedCoupons";
import type { FeedCoupon, FeedStore } from "@/lib/home/feed";
import { toFeedCoupon } from "@/lib/home/toFeedCoupon";
import { CouponCard } from "@/features/catalog/components/CouponCard";

export type SavedRow = { id: string; node: ReactNode };

export type SavedRowsResult = {
  rows: SavedRow[];
  /** Asked-for ids that could not be rendered (not in the feed, expired, or unknown). */
  unresolved: string[];
};

/** Cap on account lookups per call: the sheet links to the account page for the rest. */
const MAX_LOOKUPS = 24;
const DEFAULT_BG = "#8529CD";

function row(coupon: FeedCoupon, store: FeedStore, category: { name: string } | null): SavedRow {
  return { id: coupon.id, node: createElement(CouponCard, { coupon, store, category, variant: "row" }) };
}

/** Saved ids -> coupon slugs from the signed-in account; empty for guests or on any failure. */
async function accountSlugs(wanted: Set<string>): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  let cursor: string | null = null;
  for (let i = 0; i < 10 && out.size < wanted.size; i++) {
    const qs: string = `limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const page: CursorPage<SavedCouponItem> | null = await accountFetch<CursorPage<SavedCouponItem>>(
      `/api/v1/account/saved-coupons?${qs}`,
    );
    if (!page) break;
    for (const item of page.data) if (wanted.has(item.couponId) && item.couponSlug) out.set(item.couponId, item.couponSlug);
    if (!page.page.hasMore || !page.page.nextCursor) break;
    cursor = page.page.nextCursor;
  }
  return out;
}

/** Public active coupon by slug; null when it is gone or expired. */
async function couponBySlug(slug: string): Promise<CouponDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/coupons/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    return res.ok ? ((await res.json()) as CouponDetail) : null;
  } catch {
    return null;
  }
}

function storeOf(detail: CouponDetail, known: Map<string, FeedStore>): FeedStore | null {
  const s = detail.store;
  if (!s) return null;
  return (
    known.get(s.slug) ?? {
      id: s.slug,
      name: s.name,
      logo: s.logoUrl || null,
      mono: s.name.slice(0, 2).toUpperCase(),
      bg: DEFAULT_BG,
      fg: "#fff",
      cat: null,
      url: null,
      coupons: 0,
      best: null,
      popular: null,
    }
  );
}

/**
 * Row cards for the saved sheet. Ids in the homepage feed render from it; for
 * a signed-in user the rest are looked up through the account saved-coupons
 * list and the public coupon endpoint. Whatever still cannot render comes back
 * in `unresolved` so the sheet can link to the account page for it. Runs on
 * the server because CouponCard is a server component.
 */
export async function loadSavedRows(ids: string[]): Promise<SavedRowsResult> {
  const asked = ids.slice(0, 200);
  const feed = await getHomeFeed();
  const stores = new Map(feed.stores.map((s) => [s.id, s]));
  const cats = new Map(feed.categories.map((c) => [c.id, c]));
  const catOf = (slug: string | null) => {
    const c = slug ? cats.get(slug) : null;
    return c ? { name: c.name } : null;
  };

  const byId = new Map<string, SavedRow>();
  const inFeed = new Map(feed.coupons.map((c) => [c.id, c]));
  for (const id of asked) {
    const coupon = inFeed.get(id);
    const store = coupon ? stores.get(coupon.store) : undefined;
    if (coupon && store) byId.set(id, row(coupon, store, catOf(coupon.cat)));
  }

  const missing = new Set(asked.filter((id) => !byId.has(id)));
  if (missing.size > 0) {
    const slugs = [...(await accountSlugs(missing))].slice(0, MAX_LOOKUPS);
    const details = await Promise.all(slugs.map(async ([id, slug]) => [id, await couponBySlug(slug)] as const));
    for (const [id, detail] of details) {
      if (!detail || detail.id !== id) continue;
      const store = storeOf(detail, stores);
      if (!store) continue;
      const coupon = toFeedCoupon({ ...detail, storeId: store.id, storeSlug: store.id }, null, store.id);
      byId.set(id, row(coupon, store, catOf(coupon.cat)));
    }
  }

  return {
    rows: asked.flatMap((id) => {
      const r = byId.get(id);
      return r ? [r] : [];
    }),
    unresolved: asked.filter((id) => !byId.has(id)),
  };
}
