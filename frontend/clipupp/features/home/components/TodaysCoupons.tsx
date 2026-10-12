import { getTranslations } from "next-intl/server";
import type { HomepageSectionPayload } from "@/lib/api/homepage";
import type { HomeFeed } from "@/lib/home/feed";
import { rootCategories, shortCategoryLabel } from "@/lib/home/categoryLabel";
import { timeAgo } from "@/lib/format/timeAgo";
import { fetchTodayPage } from "../lib/todayPage";
import { buildItems, isLive, mostUsed } from "../lib/todayRows";
import { SectionHeader } from "./SectionHeader";
import { SyncStatus } from "./SyncStatus";
import { TodaysCouponsClient } from "./TodaysCouponsClient";

const PAGE = 10;

/**
 * Today's top coupons (server shell). Renders the first page of "All" (most
 * used) into the HTML; the client takes over tabs, sort, store filter and
 * paging through the `loadTodayCoupons` server action.
 */
export async function TodaysCoupons({
  feed,
  section,
}: {
  feed: HomeFeed;
  section: Pick<HomepageSectionPayload, "subtitle" | "title">;
}) {
  const [t, tc] = await Promise.all([getTranslations("home.today"), getTranslations("catalog.card")]);
  // First page comes from the same endpoint the client pages through (so codes
  // and the cursor are real); the feed's coupons are the fallback.
  let page = await fetchTodayPage({ tab: "all", store: "", cursor: null, limit: PAGE, startIndex: 0 });
  if (!page.ok || page.items.length === 0) {
    const stores = new Map(feed.stores.map((s) => [s.id, s]));
    const first = feed.coupons.filter((c) => isLive(c)).sort(mostUsed).slice(0, PAGE);
    page = { ok: true, items: buildItems(first, stores, feed, "row"), nextCursor: null };
  }
  const ago = timeAgo(feed.generatedAt);
  const agoText = ago ? (ago.unit === "now" ? t("now") : tc("ago", { unit: ago.unit, n: ago.n })) : t("now");
  const tabs = rootCategories(feed.categories)
    .filter((c) => !c.hot)
    .map((c) => ({ id: c.id, label: shortCategoryLabel(c.name), title: c.name, count: c.couponCount }));
  const subtitle = section.subtitle?.trim();

  return (
    <section className="clipupp-container pb-12 pt-4 lg:pb-20" id="today" aria-labelledby="today-heading">
      <SectionHeader
        id="today-heading"
        eyebrow={subtitle || t("eyebrow")}
        title={t("title")}
        actions={<SyncStatus label={t("updated", { ago: agoText })} />}
      />
      <TodaysCouponsClient
        tabs={tabs}
        total={feed.stats.activeCoupons || feed.coupons.length}
        initial={page.items}
        initialCursor={page.nextCursor}
        storeNames={Object.fromEntries(feed.stores.map((s) => [s.id, s.name]))}
        pageSize={PAGE}
      />
    </section>
  );
}
