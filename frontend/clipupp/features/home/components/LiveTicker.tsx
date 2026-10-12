import { getTranslations } from "next-intl/server";
import type { FeedCoupon, FeedStore } from "@/lib/home/feed";
import { timeAgo } from "@/lib/format/timeAgo";
import { StoreTile } from "@/features/catalog/components/StoreTile";

/**
 * Live verification ticker: the 10 most recently verified coupons in an
 * endless marquee. The list is rendered twice (second copy aria-hidden) and
 * the track translates by -50%. Reduced motion falls back to a manual scroll
 * of a single copy.
 */
export async function LiveTicker({ coupons, stores }: { coupons: FeedCoupon[]; stores: FeedStore[] }) {
  const t = await getTranslations("home.ticker");
  const tc = await getTranslations("catalog.card");
  const byId = new Map(stores.map((s) => [s.id, s]));
  const items = coupons
    .filter((c) => c.verifiedAt && byId.has(c.store))
    .sort((a, b) => Date.parse(b.verifiedAt!) - Date.parse(a.verifiedAt!))
    .slice(0, 10);
  if (items.length < 3) return null;

  const rendered = items.map((c) => {
    const store = byId.get(c.store)!;
    const ago = timeAgo(c.verifiedAt);
    return { c, store, ago: ago ? tc("ago", { unit: ago.unit, n: ago.n }) : null };
  });

  const list = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {rendered.map(({ c, store, ago }) => (
        <li key={c.id} className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-[14px]">
          <StoreTile store={store} size={22} className="!rounded-md !p-0.5 !text-[8px]" />
          <b className="font-semibold text-clipupp-neutral-900">{store.name}</b>
          <span className="text-clipupp-neutral-700">{c.title}</span>
          {ago && <span className="font-medium text-clipupp-success-strong">✓ {t("verified", { ago })}</span>}
          <span aria-hidden className="mx-5 h-1 w-1 shrink-0 rounded-full bg-clipupp-neutral-300" />
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-label={t("aria")}
      className="relative h-11 overflow-hidden border-y border-clipupp-neutral-200 bg-clipupp-surface motion-reduce:overflow-x-auto motion-reduce:clipupp-no-scrollbar"
    >
      <div className="clipupp-marquee h-full items-center pl-24" style={{ "--dur": `${items.length * 5}s` } as React.CSSProperties}>
        {list(false)}
        <div className="flex motion-reduce:hidden">{list(true)}</div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-clipupp-surface from-75% to-transparent pl-4 pr-8">
        <span className="mr-2.5 h-2 w-2 rounded-full bg-clipupp-success shadow-[0_0_0_4px_rgb(var(--clipupp-success-rgb)/0.18)]" aria-hidden />
        <span className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-clipupp-success-strong">{t("label")}</span>
      </div>
    </section>
  );
}
