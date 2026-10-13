import { getTranslations } from "next-intl/server";
import { Rail, RailArrows } from "@/components/site/Rail";
import type { HomeFeed } from "@/lib/home/feed";
import { saleState, type SaleState } from "@/lib/home/saleState";
import { SaleCard } from "./SaleCard";
import { SectionHeader } from "./SectionHeader";

const RAIL_ID = "calendar-rail";
const ORDER: Record<SaleState, number> = { live: 0, soon: 1, ended: 2 };

/** Festive sale calendar (server): live first, then upcoming, then ended. */
export async function SaleCalendarRail({ feed }: { feed: HomeFeed }) {
  const t = await getTranslations("home.calendar");
  const stores = new Map(feed.stores.map((s) => [s.id, s]));
  const now = new Date();
  const sales = feed.sales
    .filter((s) => stores.has(s.store))
    .map((s) => ({ s, state: saleState(s.startAt, s.endAt, now) }))
    .sort((a, b) => ORDER[a.state] - ORDER[b.state] || Date.parse(a.s.startAt) - Date.parse(b.s.startAt));
  if (sales.length === 0) return null;
  return (
    <section id="calendar" className="clipupp-container pt-9 sm:pt-12 lg:pt-16" aria-labelledby="calendar-heading">
      <SectionHeader
        id="calendar-heading"
        eyebrow={t("eyebrow")}
        title={t("title")}
        sub={t("sub")}
        actions={<RailArrows railId={RAIL_ID} />}
      />
      <Rail
        id={RAIL_ID}
        ariaLabel={t("railAria")}
        cols={{ base: "72%", sm: "40%", lg: "calc((100% - 96px) / 5)" }}
        gap={{ base: 16, lg: 24 }}
        className="-mt-3 py-3"
      >
        {sales.map(({ s, state }) => (
          <SaleCard key={s.id} sale={s} store={stores.get(s.store)!} state={state} />
        ))}
      </Rail>
    </section>
  );
}
