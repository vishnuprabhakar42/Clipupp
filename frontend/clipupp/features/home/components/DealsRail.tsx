import { displayShortName } from "@/lib/home/storeName";
import { getTranslations } from "next-intl/server";
import { RailArrows } from "@/components/site/Rail";
import type { HomeFeed } from "@/lib/home/feed";
import { DealCard } from "./DealCard";
import { DealsRailClient, type DealEntry } from "./DealsRailClient";
import { SectionHeader } from "./SectionHeader";

const RAIL_ID = "deals-rail";

function endsKey(iso: string | null): number {
  const n = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(n) ? Infinity : n;
}

/** Live product deals (server shell): cards render once here, the chip filter runs on the client. */
export async function DealsRail({ feed }: { feed: HomeFeed }) {
  const t = await getTranslations("home.deals");
  const stores = new Map(feed.stores.map((s) => [s.id, s]));
  const deals = feed.deals.filter((d) => stores.has(d.store)).sort((a, b) => endsKey(a.endsAt) - endsKey(b.endsAt));
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
    <section id="deals" className="clipupp-container pt-8 sm:pt-12 lg:pt-16" aria-labelledby="deals-heading">
      <SectionHeader
        id="deals-heading"
        eyebrow={t("eyebrow")}
        eyebrowTone="danger"
        title={t("title")}
        actions={<RailArrows railId={RAIL_ID} />}
      />
      <DealsRailClient railId={RAIL_ID} entries={entries} chips={chips} />
    </section>
  );
}
