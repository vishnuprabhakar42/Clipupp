import { getTranslations } from "next-intl/server";
import { RailArrows } from "@/components/site/Rail";
import type { HomeFeed } from "@/lib/home/feed";
import { BankOfferCard } from "./BankOfferCard";
import { BankOffersRailClient, type BankEntry } from "./BankOffersRailClient";
import { SectionHeader } from "./SectionHeader";

const RAIL_ID = "bank-rail";

/** Bank and card offers (server shell); the bank chip filter runs on the client. */
export async function BankOffersRail({ feed }: { feed: HomeFeed }) {
  const t = await getTranslations("home.bank");
  const stores = new Map(feed.stores.map((s) => [s.id, s]));
  const offers = feed.bankOffers.filter((o) => stores.has(o.store));
  if (offers.length === 0) return null;
  const entries: BankEntry[] = offers.map((o) => ({
    id: o.id,
    bank: o.bank,
    node: <BankOfferCard key={o.id} offer={o} store={stores.get(o.store)!} />,
  }));
  const chips = [...new Set(offers.map((o) => o.bank))].map((b) => ({ id: b, label: b }));
  return (
    <section id="bank" className="clipupp-container pt-10 md:pt-14 lg:pt-[72px]" aria-labelledby="bank-heading">
      <SectionHeader
        id="bank-heading"
        eyebrow={t("eyebrow")}
        title={t("title")}
        sub={t("sub")}
        actions={<RailArrows railId={RAIL_ID} />}
      />
      <BankOffersRailClient railId={RAIL_ID} entries={entries} chips={chips} />
    </section>
  );
}
