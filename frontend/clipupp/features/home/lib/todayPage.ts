import { categoriesApi } from "@/lib/api/categories";
import { couponsApi } from "@/lib/api/coupons";
import { storesApi } from "@/lib/api/stores";
import type { StoreSummary } from "@/lib/api/types";
import type { FeedCoupon, FeedStore } from "@/lib/home/feed";
import { getHomeFeed } from "@/lib/home/getHomeFeed";
import { toFeedCoupon } from "@/lib/home/toFeedCoupon";
import { buildItems, isLive, mostUsed, type RowItem } from "./todayRows";

export type TodayPageInput = {
  /** Category slug or "all". */
  tab: string;
  /** Store slug, empty for none. Wins over `tab`. */
  store: string;
  /** Opaque cursor returned by the previous call; null for the first page. */
  cursor: string | null;
  limit: number;
  /** Stagger offset for the rise animation. */
  startIndex: number;
};

export type TodayPage = { ok: boolean; items: RowItem[]; nextCursor: string | null };

const DEFAULT_BG = "#8529CD";
let storeCache: { at: number; byId: Map<string, StoreSummary> } | null = null;

async function backendStores(): Promise<Map<string, StoreSummary>> {
  if (storeCache && Date.now() - storeCache.at < 5 * 60_000) return storeCache.byId;
  const res = await storesApi.list({ limit: 100 });
  const byId = new Map(res.data.map((s) => [s.id, s]));
  storeCache = { at: Date.now(), byId };
  return byId;
}

function toFeedStore(s: StoreSummary): FeedStore {
  return {
    id: s.slug,
    name: s.name,
    logo: s.logoUrl || null,
    mono: s.name.slice(0, 2).toUpperCase(),
    bg: s.brandColor ?? DEFAULT_BG,
    fg: "#fff",
    cat: null,
    url: null,
    coupons: s.activeCouponCount ?? 0,
    best: s.cashbackRate,
    popular: null,
  };
}

const offset = (cursor: string | null, prefix: string) =>
  cursor?.startsWith(prefix) ? Math.max(0, parseInt(cursor.slice(prefix.length), 10) || 0) : 0;

/** Backend offset cursors are base64 "o:<page>"; the store endpoint wants the page number. */
function storePage(cursor: string | null): number {
  if (!cursor) return 0;
  if (cursor.startsWith("p:")) return Math.max(0, parseInt(cursor.slice(2), 10) || 0);
  return 0;
}

/**
 * One page of Today's list. Runs on the server so the cards render as server
 * components and the client only receives finished markup plus the coupon data
 * it needs for sorting. All, category and store tabs read their cursor-paged
 * endpoint; fixture-only categories (and empty demo results) read the feed.
 */
export async function fetchTodayPage(input: TodayPageInput): Promise<TodayPage> {
  const { tab, store, cursor, limit, startIndex } = input;
  try {
    const feed = await getHomeFeed();
    const byId = await backendStores().catch(() => new Map<string, StoreSummary>());
    const bySlug = new Map<string, FeedStore>();
    for (const s of byId.values()) bySlug.set(s.slug, toFeedStore(s));
    for (const s of feed.stores) bySlug.set(s.id, s);
    const slugById = new Map([...byId].map(([id, s]) => [id, s.slug]));

    const finish = (coupons: FeedCoupon[], nextCursor: string | null): TodayPage => ({
      ok: true,
      items: buildItems(coupons.filter((c) => isLive(c)), bySlug, feed, "row", startIndex),
      nextCursor,
    });

    const local = (): TodayPage => {
      const all = feed.coupons
        .filter((c) => (store ? c.store === store : tab === "all" || c.cat === tab))
        .filter((c) => isLive(c))
        .sort(mostUsed);
      const from = offset(cursor, "f:");
      const next = from + limit;
      return finish(all.slice(from, next), next < all.length ? `f:${next}` : null);
    };

    const category = feed.categories.find((c) => c.id === tab);
    if (!store && tab !== "all" && (!category || category.source === "fixture")) return local();

    const mapPage = (data: Parameters<typeof toFeedCoupon>[0][]) =>
      data.map((c) => toFeedCoupon(c, null, c.storeSlug ?? slugById.get(c.storeId)));

    let coupons: FeedCoupon[];
    let nextCursor: string | null;
    if (store) {
      const page = storePage(cursor);
      const res = await storesApi.coupons(store, page, limit);
      coupons = mapPage(res.data);
      nextCursor = res.page.hasMore ? `p:${page + 1}` : null;
    } else if (tab !== "all") {
      const res = await categoriesApi.coupons(tab, cursor ?? undefined, limit);
      coupons = mapPage(res.data);
      nextCursor = res.page.hasMore ? res.page.nextCursor : null;
    } else {
      const fromTop = async (): Promise<{ coupons: FeedCoupon[]; nextCursor: string | null }> => {
        const from = offset(cursor, "t:");
        const top = await couponsApi.top(100);
        const next = from + limit;
        return { coupons: mapPage(top.slice(from, next)), nextCursor: next < top.length ? `t:${next}` : null };
      };
      if (cursor?.startsWith("t:")) {
        ({ coupons, nextCursor } = await fromTop());
      } else {
        try {
          const res = await couponsApi.list({ cursor: cursor ?? undefined, limit });
          coupons = mapPage(res.data);
          nextCursor = res.page.hasMore ? res.page.nextCursor : null;
        } catch {
          // The unfiltered list endpoint can fail; the top endpoint still carries store info.
          ({ coupons, nextCursor } = await fromTop());
        }
      }
    }

    if (coupons.length === 0 && !cursor && feed.demo) return local();
    return finish(coupons, nextCursor);
  } catch {
    return { ok: false, items: [], nextCursor: null };
  }
}
