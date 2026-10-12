import type {
  HomepageCampaign,
  HomepageCouponSummary,
  HomepageLayout,
  HomepageSectionPayload,
  HomepageStoreSummary,
} from "@/lib/api/homepage";
import demoFixture from "@/features/home/fixtures/demo-feed.json";
import { toFeedCoupon } from "./toFeedCoupon";
import { resolveCategoryIcon } from "./categoryIcon";
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

function collectCoupons(layout: HomepageLayout | null): { feed: FeedCoupon; raw: HomepageCouponSummary }[] {
  const seen = new Set<string>();
  const out: { feed: FeedCoupon; raw: HomepageCouponSummary }[] = [];
  const add = (list: HomepageCouponSummary[] | null | undefined, ranked: boolean) => {
    (list ?? []).forEach((c, i) => {
      if (seen.has(c.id)) return;
      seen.add(c.id);
      out.push({ feed: toFeedCoupon(c, ranked ? i + 1 : null), raw: c });
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
  const base = new Map<string, { name: string; icon: string | null; root?: boolean }>();
  for (const c of sectionOf(layout, "hero_search")?.categories ?? []) base.set(c.slug, { name: c.title, icon: c.icon, root: true });
  for (const tab of sectionOf(layout, "top_deals")?.categoryTabs ?? [])
    if (!base.has(tab.slug)) base.set(tab.slug, { name: tab.title, icon: null });
  for (const { raw } of coupons)
    for (const slug of raw.categorySlugs) if (!base.has(slug)) base.set(slug, { name: titleCase(slug), icon: null });

  const tabCount = new Map<string, number>();
  for (const tab of sectionOf(layout, "top_deals")?.categoryTabs ?? []) tabCount.set(tab.slug, tab.coupons.length);

  // A leaf's parent is inferred as the single root present on every coupon that
  // carries the leaf (the payload has no tree); ambiguous leaves stay undefined.
  const roots = [...base].filter(([, m]) => m.root).map(([slug]) => slug);
  const parentOf = (slug: string): string | undefined => {
    const lists = coupons.map(({ raw }) => raw.categorySlugs).filter((l) => l.includes(slug));
    const common = roots.filter((r) => lists.length > 0 && lists.every((l) => l.includes(r)));
    return common.length === 1 ? common[0] : undefined;
  };

  return [...base].map(([slug, meta]) => {
    const parent = meta.root ? null : roots.length ? parentOf(slug) : undefined;
    const top = new Map<string, string>();
    for (const { feed, raw } of coupons) {
      if (top.size >= 3) break;
      if (raw.categorySlugs.includes(slug) && !top.has(feed.store)) top.set(feed.store, raw.storeName ?? titleCase(feed.store));
    }
    return {
      id: slug,
      name: meta.name,
      icon: resolveCategoryIcon(meta.icon, slug, meta.name),
      // hero_search lists the root categories; the rest come from tabs and coupon slugs.
      ...(parent !== undefined ? { parent } : {}),
      couponCount: tabCount.get(slug) ?? 0,
      topStores: [...top].map(([s, name]) => ({ slug: s, name })),
    };
  });
}

function buildSpotlight(
  layout: HomepageLayout | null,
  now: Date,
  storeSlugById: Map<string, string>,
): FeedSpotlight[] {
  return (sectionOf(layout, "bank_offers")?.campaigns ?? []).map((c: HomepageCampaign) => {
    const live = Date.parse(c.startsAt) <= now.getTime() && now.getTime() <= Date.parse(c.endsAt);
    // The first pinned store that resolves names the store; otherwise the campaign slug stands in.
    const pinned = (c.pinnedStoreIds ?? []).map((id) => storeSlugById.get(id)).find((slug): slug is string => !!slug);
    return {
      store: pinned ?? c.slug,
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

/** Store id to slug, from the featured stores and from the stores named on coupons. */
function storeSlugIndex(layout: HomepageLayout | null, coupons: { raw: HomepageCouponSummary }[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const s of sectionOf(layout, "featured_stores")?.stores ?? []) m.set(s.id, s.slug);
  for (const { raw } of coupons) if (raw.storeSlug && !m.has(raw.storeId)) m.set(raw.storeId, raw.storeSlug);
  return m;
}

/** Lower-case alphanumerics with a trailing "india" dropped: "Amazon India" and "Amazon" match. */
function normName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+india$/, "")
    .replace(/\s/g, "");
}

/** Fixture category ids whose backend slug is not a plain prefix of the id. */
const CATEGORY_ALIASES: Record<string, string> = {
  grocery: "groceries",
  recharge: "mobile-recharge",
  ott: "entertainment",
};

/** Fixture category id -> backend category slug, for the ids the backend knows. */
function mapCategoryIds(fixtureCats: FeedCategory[], backendCats: FeedCategory[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of fixtureCats) {
    const hit =
      backendCats.find((b) => b.id === f.id) ??
      backendCats.find((b) => b.id.startsWith(`${f.id}-`)) ??
      backendCats.find((b) => b.id === CATEGORY_ALIASES[f.id]) ??
      backendCats.find((b) => normName(b.name) === normName(f.name));
    if (hit) m.set(f.id, hit.id);
  }
  return m;
}

/** Fixture store id -> backend store slug, matched by slug or normalised name. */
function mapStoreIds(fixtureStores: FeedStore[], backendStores: FeedStore[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of fixtureStores) {
    const hit =
      backendStores.find((b) => b.id === f.id) ?? backendStores.find((b) => normName(b.name) === normName(f.name));
    if (hit) m.set(f.id, hit.id);
  }
  return m;
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

const SOCIAL_NETWORKS = ["instagram", "youtube", "x", "facebook", "linkedin"] as const;

/** Social links from `social.<network>` settings; only http(s) URLs that are set. */
function parseSocial(settings: Record<string, unknown>): HomeFeed["social"] {
  const out: HomeFeed["social"] = [];
  for (const network of SOCIAL_NETWORKS) {
    const url = nonEmptyString(settings[`social.${network}`]);
    if (url && /^https?:\/\//i.test(url)) out.push({ network, url });
  }
  return out;
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
    spotlight: buildSpotlight(layout, now, storeSlugIndex(layout, coupons)),
    coupons: coupons.map((c) => c.feed),
    deals: [],
    bankOffers: [],
    sales: [],
    banks: parseBanks(settings["bank_offers.banks"]),
    festival: festivalName && festivalDate ? { name: festivalName, date: festivalDate } : null,
    faq: parseFaq(settings["faq.items"]),
    popularSearches: parseSearches(settings["footer.popular_searches"]),
    telegramBot: nonEmptyString(settings["telegram.bot_username"]),
    supportEmail: nonEmptyString(settings["support.email"]),
    partnerEmail: nonEmptyString(settings["footer.partner_email"]),
    social: parseSocial(settings),
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
  // Fixture ids are remapped to backend slugs by name before anything is merged.
  const catMap = mapCategoryIds(fixture.categories, feed.categories);
  const storeMap = mapStoreIds(fixture.stores, feed.stores);
  const mapCat = (c: string | null) => (c ? (catMap.get(c) ?? c) : c);
  const mapStore = (id: string) => storeMap.get(id) ?? id;
  fixture.coupons = fixture.coupons.map((c) => ({ ...c, store: mapStore(c.store), cat: mapCat(c.cat) }));
  fixture.deals = fixture.deals.map((d) => ({ ...d, store: mapStore(d.store), cat: mapCat(d.cat) }));
  fixture.bankOffers = fixture.bankOffers.map((b) => ({ ...b, store: mapStore(b.store) }));
  fixture.sales = fixture.sales.map((x) => ({ ...x, store: mapStore(x.store) }));

  // Categories and stores: the backend ones first, then fixture-only ones (roots, marked as fixture).
  const fixtureOnlyCats = fixture.categories
    .filter((c) => !catMap.has(c.id))
    .map((c) => ({ ...c, parent: null, source: "fixture" as const }));
  merged.categories = [...feed.categories, ...fixtureOnlyCats];
  const ranked = feed.stores.some((st) => st.popular != null);
  const fixtureOnlyStores = fixture.stores
    .filter((st) => !storeMap.has(st.id))
    .map((st) => ({ ...st, cat: mapCat(st.cat), popular: ranked ? null : st.popular, source: "fixture" as const }));
  merged.stores = [...feed.stores, ...fixtureOnlyStores];

  fill("coupons");
  fill("deals");
  fill("bankOffers");
  fill("sales");
  fill("banks");
  fill("festival");
  fill("faq");
  fill("popularSearches");
  fill("telegramBot");
  fill("supportEmail");
  fill("partnerEmail");
  fill("social");
  if (!layout) merged.stats = fixture.stats;

  // Spotlight: backend slides have no perks yet, so the fixture tops them up to three.
  const backendSlides = feed.spotlight;
  const couponIds = new Set(merged.coupons.map((c) => c.id));
  const kickers = backendSlides.map((x) => normName(x.kicker));
  const extra = fixture.spotlight
    .filter((x) => !kickers.some((k) => k.includes(normName(x.kicker))))
    .map((x) => ({ ...x, store: mapStore(x.store), couponId: x.couponId && couponIds.has(x.couponId) ? x.couponId : null }));
  merged.spotlight =
    backendSlides.length === 0
      ? fixture.spotlight.map((x) => ({ ...x, store: mapStore(x.store) }))
      : backendSlides.every((x) => x.perks.length === 0)
        ? [...backendSlides, ...extra].slice(0, 3)
        : backendSlides;

  // Demo: the design order in full; backend positions still win in production.
  merged.sectionOrder = [...fixture.sectionOrder];
  return merged;
}
