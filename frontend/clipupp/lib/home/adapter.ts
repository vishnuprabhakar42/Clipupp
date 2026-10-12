import type {
  HomepageCampaign,
  HomepageCouponSummary,
  HomepageLayout,
  HomepageSectionPayload,
  HomepageStoreSummary,
} from "@/lib/api/homepage";
import demoFixture from "@/features/home/fixtures/demo-feed.json";
import { badgeFor } from "@/lib/format/badge";
import { categoryIcon } from "./categoryIcon";
import type {
  FeedCategory,
  FeedCoupon,
  FeedSpotlight,
  FeedStats,
  FeedStore,
  HomeFeed,
} from "./feed";

export type ToHomeFeedOptions = { demo: boolean; now?: Date };

const DEFAULT_BG = "#8529CD";
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/;

const EMPTY_STATS: FeedStats = { verifiedToday: 0, successRate7d: null, storeCount: 0, activeCoupons: 0 };

const sectionOf = (layout: HomepageLayout | null, code: string): HomepageSectionPayload | undefined =>
  layout?.sections.find((s) => s.code === code);

function titleCase(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function parseJsonArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim()) {
    try {
      const parsed: unknown = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function nonEmptyString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function toCoupon(c: HomepageCouponSummary, trending: number | null): FeedCoupon {
  return {
    id: c.id,
    store: c.storeSlug ?? c.storeId,
    title: c.title,
    terms: c.description,
    code: c.code,
    badge: badgeFor({ savingsLabel: c.savingsLabel, title: c.title, code: c.code }),
    verifiedAt: c.verifiedAt,
    success: null,
    uses: c.usedCount,
    exclusive: c.exclusive,
    trending,
    expiresAt: c.expiresAt,
    cat: c.categorySlugs[0] ?? null,
    slug: c.slug,
  };
}

function collectCoupons(layout: HomepageLayout | null): { feed: FeedCoupon; raw: HomepageCouponSummary }[] {
  const seen = new Set<string>();
  const out: { feed: FeedCoupon; raw: HomepageCouponSummary }[] = [];
  const add = (list: HomepageCouponSummary[] | null | undefined, ranked: boolean) => {
    (list ?? []).forEach((c, i) => {
      if (seen.has(c.id)) return;
      seen.add(c.id);
      out.push({ feed: toCoupon(c, ranked ? i + 1 : null), raw: c });
    });
  };
  add(sectionOf(layout, "trending_coupons")?.coupons, true);
  add(sectionOf(layout, "hero_search")?.coupons, false);
  for (const tab of sectionOf(layout, "top_deals")?.categoryTabs ?? []) add(tab.coupons, false);
  return out;
}

function buildStores(
  layout: HomepageLayout | null,
  coupons: { feed: FeedCoupon; raw: HomepageCouponSummary }[],
): FeedStore[] {
  const catByStore = new Map<string, string>();
  for (const { feed } of coupons) if (feed.cat && !catByStore.has(feed.store)) catByStore.set(feed.store, feed.cat);

  const stores: FeedStore[] = (sectionOf(layout, "featured_stores")?.stores ?? []).map(
    (s: HomepageStoreSummary, i: number) => ({
      id: s.slug,
      name: s.name,
      logo: s.logoUrl || null,
      mono: s.name.slice(0, 2).toUpperCase(),
      bg: s.brandColor ?? DEFAULT_BG,
      fg: "#fff",
      cat: catByStore.get(s.slug) ?? null,
      url: null,
      coupons: s.activeCouponCount ?? 0,
      best: s.cashbackRate,
      popular: i + 1,
    }),
  );

  // The page drops coupons whose store is unknown, so stores that only show up
  // on a coupon are added (unranked) after the featured ones.
  const known = new Set(stores.map((s) => s.id));
  for (const { feed, raw } of coupons) {
    if (known.has(feed.store)) continue;
    known.add(feed.store);
    const name = raw.storeName ?? titleCase(feed.store);
    stores.push({
      id: feed.store,
      name,
      logo: raw.storeLogoUrl || null,
      mono: name.slice(0, 2).toUpperCase(),
      bg: raw.storeBrandColor ?? DEFAULT_BG,
      fg: "#fff",
      cat: feed.cat,
      url: null,
      coupons: 0,
      best: null,
      popular: null,
    });
  }
  return stores;
}

function buildCategories(
  layout: HomepageLayout | null,
  coupons: { feed: FeedCoupon; raw: HomepageCouponSummary }[],
): FeedCategory[] {
  const base = new Map<string, { name: string; icon: string | null }>();
  for (const c of sectionOf(layout, "hero_search")?.categories ?? []) base.set(c.slug, { name: c.title, icon: c.icon });
  for (const tab of sectionOf(layout, "top_deals")?.categoryTabs ?? [])
    if (!base.has(tab.slug)) base.set(tab.slug, { name: tab.title, icon: null });
  for (const { raw } of coupons)
    for (const slug of raw.categorySlugs) if (!base.has(slug)) base.set(slug, { name: titleCase(slug), icon: null });

  const tabCount = new Map<string, number>();
  for (const tab of sectionOf(layout, "top_deals")?.categoryTabs ?? []) tabCount.set(tab.slug, tab.coupons.length);

  return [...base].map(([slug, meta]) => {
    const top = new Map<string, string>();
    for (const { feed, raw } of coupons) {
      if (top.size >= 3) break;
      if (raw.categorySlugs.includes(slug) && !top.has(feed.store)) top.set(feed.store, raw.storeName ?? titleCase(feed.store));
    }
    return {
      id: slug,
      name: meta.name,
      icon: categoryIcon(meta.icon),
      couponCount: tabCount.get(slug) ?? 0,
      topStores: [...top].map(([s, name]) => ({ slug: s, name })),
    };
  });
}

function buildSpotlight(layout: HomepageLayout | null, now: Date): FeedSpotlight[] {
  return (sectionOf(layout, "bank_offers")?.campaigns ?? []).map((c: HomepageCampaign) => {
    const live = Date.parse(c.startsAt) <= now.getTime() && now.getTime() <= Date.parse(c.endsAt);
    return {
      // The campaign payload carries no pinned stores yet, so the slug stands in.
      store: c.slug,
      kicker: c.name,
      flag: live ? "Live now" : null,
      title: c.heroTitle ?? c.name,
      text: c.heroSubtitle ?? "",
      perks: [],
      endsAt: c.endsAt,
      couponId: null,
    };
  });
}

function parseBanks(v: unknown): string[] {
  const list = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  return list.map((b) => String(b).trim()).filter(Boolean);
}

function parseSearches(v: unknown): { label: string; href: string }[] {
  return parseJsonArray(v).flatMap((item) => {
    if (typeof item === "string") return [{ label: item, href: `/search?q=${encodeURIComponent(item)}` }];
    if (item && typeof item === "object") {
      const { label, href } = item as Record<string, unknown>;
      if (typeof label === "string" && typeof href === "string") return [{ label, href }];
    }
    return [];
  });
}

function parseFaq(v: unknown): { q: string; a: string }[] {
  return parseJsonArray(v).flatMap((item) => {
    if (item && typeof item === "object") {
      const { q, a } = item as Record<string, unknown>;
      if (typeof q === "string" && typeof a === "string") return [{ q, a }];
    }
    return [];
  });
}

/** Deep copy of the fixture with every ISO timestamp moved forward by `delta` ms. */
function shiftFixture(delta: number): HomeFeed {
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return ISO_RE.test(v) ? new Date(Date.parse(v) + delta).toISOString() : v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(demoFixture) as HomeFeed;
}

/**
 * Adapt the backend homepage layout and public settings into the HomeFeed the
 * v3 page renders. With `demo` on, every top-level key the backend left empty
 * is filled from the fixture (whole key, never per item) and fixture
 * timestamps are shifted so the feed reads as generated just now.
 */
export function toHomeFeed(
  layout: HomepageLayout | null,
  settings: Record<string, unknown>,
  opts: ToHomeFeedOptions,
): HomeFeed {
  const now = opts.now ?? new Date();
  const coupons = collectCoupons(layout);

  const festivalName = nonEmptyString(settings["festival.name"]);
  const festivalDate = nonEmptyString(settings["festival.date"]);

  const feed: HomeFeed = {
    generatedAt: now.toISOString(),
    demo: false,
    stats: layout
      ? {
          // The payload has no "today" count yet; the 7 day count is the proxy.
          verifiedToday: layout.stats.verifiedLast7d,
          successRate7d: null,
          storeCount: layout.stats.activeStores,
          activeCoupons: layout.stats.activeCoupons,
        }
      : EMPTY_STATS,
    categories: buildCategories(layout, coupons),
    stores: buildStores(layout, coupons),
    spotlight: buildSpotlight(layout, now),
    coupons: coupons.map((c) => c.feed),
    deals: [],
    bankOffers: [],
    sales: [],
    banks: parseBanks(settings["bank_offers.banks"]),
    festival: festivalName && festivalDate ? { name: festivalName, date: festivalDate } : null,
    faq: parseFaq(settings["faq.items"]),
    popularSearches: parseSearches(settings["footer.popular_searches"]),
    telegramBot: nonEmptyString(settings["telegram.bot_username"]),
    sectionOrder: (layout?.sections ?? []).map((s) => s.code),
  };

  if (!opts.demo) return feed;

  const fixture = shiftFixture(now.getTime() - Date.parse(demoFixture.generatedAt));
  const merged: HomeFeed = { ...feed, demo: true, generatedAt: fixture.generatedAt };
  const fill = <K extends keyof HomeFeed>(key: K) => {
    const v = feed[key];
    const empty = v == null || (Array.isArray(v) && v.length === 0);
    if (empty) merged[key] = fixture[key];
  };
  fill("categories");
  fill("stores");
  fill("spotlight");
  fill("coupons");
  fill("deals");
  fill("bankOffers");
  fill("sales");
  fill("banks");
  fill("festival");
  fill("faq");
  fill("popularSearches");
  fill("telegramBot");
  if (!layout) merged.stats = fixture.stats;

  // The backend and the design use different section codes; unless the backend
  // order covers every design section, the design order wins.
  const covered = fixture.sectionOrder.every((code) => feed.sectionOrder.includes(code));
  merged.sectionOrder = covered ? feed.sectionOrder : fixture.sectionOrder;
  return merged;
}
