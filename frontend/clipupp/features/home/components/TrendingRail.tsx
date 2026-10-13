import { getTranslations } from "next-intl/server";
import { RailArrows } from "@/components/site/Rail";
import type { HomepageSectionPayload } from "@/lib/api/homepage";
import type { HomeFeed } from "@/lib/home/feed";
import { rootCategoryOf, shortCategoryLabel } from "@/lib/home/categoryLabel";
import { buildItems, isLive } from "../lib/todayRows";
import { SectionHeader } from "./SectionHeader";
import { TrendingRailClient, type TrendingEntry } from "./TrendingRailClient";

const RAIL_ID = "trending-rail";
const MAX_CANDIDATES = 40;

/**
 * Trending coupons (server shell). Header and the initial HTML come from the
 * server; the chip filter runs client side over the candidate set, so every
 * candidate card is rendered here once.
 */
export async function TrendingRail({
  feed,
  section,
}: {
  feed: HomeFeed;
  section: Pick<HomepageSectionPayload, "subtitle" | "title">;
}) {
  const t = await getTranslations("home.trending");
  const live = feed.coupons.filter((c) => isLive(c));
  const trending = live.filter((c) => c.trending != null).sort((a, b) => (a.trending ?? 0) - (b.trending ?? 0));
  if (trending.length === 0) return null;
  const rest = live.filter((c) => c.trending == null);
  const stores = new Map(feed.stores.map((s) => [s.id, s]));
  const items = buildItems([...trending, ...rest].slice(0, MAX_CANDIDATES), stores, feed, "card");
  // Chips and filtering work on root categories; a leaf maps to its root when known.
  const entries: TrendingEntry[] = items.map((i) => ({
    id: i.coupon.id,
    cat: i.coupon.cat ? rootCategoryOf(i.coupon.cat, feed.categories) : null,
    trending: i.coupon.trending,
    node: i.node,
  }));
  const catIds = new Set(entries.filter((e) => e.trending != null && e.cat).map((e) => e.cat as string));
  const chips = feed.categories
    .filter((c) => catIds.has(c.id))
    .map((c) => ({ id: c.id, label: shortCategoryLabel(c.name), title: c.name }));
  const subtitle = section.subtitle?.trim();

  return (
    <section className="clipupp-container pt-9 sm:pt-12 lg:pt-16" aria-labelledby="trending-heading">
      <SectionHeader
        id="trending-heading"
        eyebrow={subtitle || t("eyebrow")}
        title={t("title")}
        actions={<RailArrows railId={RAIL_ID} />}
      />
      <TrendingRailClient railId={RAIL_ID} entries={entries} chips={chips} />
    </section>
  );
}
