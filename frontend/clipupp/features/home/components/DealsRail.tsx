import { displayShortName } from "@/lib/home/storeName";
import { getTranslations } from "next-intl/server";
import { RailArrows } from "@/components/site/Rail";
import type { HomeFeed } from "@/lib/home/feed";
import { DealCard } from "./DealCard";
import { DealsRailClient, type DealEntry } from "./DealsRailClient";
import { SectionHeader } from "./SectionHeader";
import { ComingSoonTile } from "./ComingSoonTile";
import { JsonLd } from "@/lib/seo/jsonLd";
import { dealOfferSchema } from "@/lib/seo/schemas";
import { comingSoon } from "@/lib/home/anchors";
import { liveDeals } from "@/lib/home/liveDeals";

const RAIL_ID = "deals-rail";

/**
 * Live product deals (server shell): cards render once here, the chip filter
 * runs on the client. Ended deals are left out of both the cards and `ld-deals`.
 */
export async function DealsRail({ feed }: { feed: HomeFeed }) {
  const t = await getTranslations("home.deals");
  if (comingSoon("deals", feed)) {
    const ts = await getTranslations("home.soon");
    return <ComingSoonTile id="deals" feed={feed} eyebrow={t("eyebrow")} eyebrowTone="danger" title={t("title")} body={ts("deals")} />;
  }
  const stores = new Map(feed.stores.map((s) => [s.id, s]));
  const deals = liveDeals(feed.deals, new Set(stores.keys()));
  if (deals.length === 0) return null;
  const entries: DealEntry[] = deals.map((d) => ({
    id: d.id,
    store: d.store,
    node: <DealCard key={d.id} deal={d} store={stores.get(d.store)!} />,
  }));
  const seen = new Set<string>();
  const chips = deals
    .filter((d) => (seen.has(d.store) ? false : (seen.add(d.store), true)))
    .map((d) => ({ id: d.store, label: displayShortName(stores.get(d.store)!.name) }));
  return (
    <section id="deals" className="clipupp-container pt-10 md:pt-14 lg:pt-[72px]" aria-labelledby="deals-heading">
      <SectionHeader
        id="deals-heading"
        eyebrow={t("eyebrow")}
        eyebrowTone="danger"
        title={t("title")}
        actions={<RailArrows railId={RAIL_ID} />}
      />
      <JsonLd
        id="ld-deals"
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: deals.map((d, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: dealOfferSchema(d, { name: stores.get(d.store)?.name ?? d.store }),
          })),
        }}
      />
      <DealsRailClient railId={RAIL_ID} entries={entries} chips={chips} />
    </section>
  );
}
