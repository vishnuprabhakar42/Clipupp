import { getTranslations } from "next-intl/server";
import { CategoryGlyph } from "@/components/site/CategoryGlyph";
import { StoreTile } from "@/features/catalog/components/StoreTile";
import { resolveCategoryIcon } from "@/lib/home/categoryIcon";
import { shortCount } from "@/lib/format/short";
import type { FeedDeal, FeedStore } from "@/lib/home/feed";
import { catTint } from "../lib/catTint";
import { DealImage } from "./DealImage";
import { CARD_HOVER } from "@/features/catalog/components/cardBits";
import { displayShortName } from "@/lib/home/storeName";

const nf = new Intl.NumberFormat("en-IN");

/** Product deal card (server). Prices render with `.clipupp-amt` so the rupee sign is CSS only. */
export async function DealCard({ deal, store }: { deal: FeedDeal; store: FeedStore }) {
  const t = await getTranslations("home.deals");
  const tint = catTint(deal.cat);
  const showOff = deal.off > 0;
  return (
    <article
      data-deal-card
      data-store={deal.store}
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-clipupp-neutral-200 bg-clipupp-surface ${CARD_HOVER}`}
    >
      <div
        className="clipupp-ph relative aspect-square w-full"
        style={{ "--t-bg": tint.bg, "--t-fg": tint.fg } as React.CSSProperties}
      >
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <CategoryGlyph name={resolveCategoryIcon(null, deal.cat)} strokeWidth={1.1} className="h-[44%] w-[44%] opacity-85" />
        </span>
        {deal.image && <DealImage src={deal.image} sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 46vw" />}
        {showOff && (
          <span className="absolute left-2 top-2 rounded-md px-[7px] py-1.5 text-[12px] font-bold leading-none text-clipupp-danger-fg bg-clipupp-danger">
            {t("off", { pct: deal.off })}
          </span>
        )}
        <StoreTile store={store} size={30} className="absolute right-2 top-2 !rounded-lg !p-[3px] shadow-card" />
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <h3 className="line-clamp-2 min-h-[2.7em] text-[13.5px] leading-[1.35] text-clipupp-neutral-900">{deal.title}</h3>
        {deal.rating != null && (
          <p className="mt-1.5 flex items-center gap-[5px] text-[12px] text-clipupp-neutral-500">
            <span
              className="rounded px-[5px] py-0.5 text-[11px] font-bold leading-snug text-clipupp-success-fg bg-clipupp-success"
              aria-label={t("rating", { rating: deal.rating.toFixed(1) })}
            >
              {deal.rating.toFixed(1)} ★
            </span>
            {deal.reviews != null && <span>({shortCount(deal.reviews)})</span>}
          </p>
        )}
        {/* Price and MRP share a line (the MRP drops whole below a long price, never
            truncated); "% off" always sits on its own line so cards align. */}
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 whitespace-nowrap">
          <span className="clipupp-amt text-[19px] font-extrabold leading-none tracking-[-0.02em] text-clipupp-neutral-900 [font-family:var(--font-sans)]">
            {nf.format(deal.price)}
          </span>
          {deal.mrp != null && deal.mrp > deal.price && (
            <span className="clipupp-amt text-[12.5px] text-clipupp-neutral-500 line-through">{nf.format(deal.mrp)}</span>
          )}
        </p>
        {showOff && deal.mrp != null && deal.mrp > deal.price && (
          <p className="mt-1 text-[12.5px] font-bold text-clipupp-success">{t("off", { pct: deal.off })}</p>
        )}
        {deal.lowest30d && <p className="mt-1.5 text-[11.5px] font-semibold text-clipupp-success">{t("lowest")}</p>}
        <div className="mt-auto pt-3.5">
          <a
            href={deal.url}
            target="_blank"
            rel="noopener sponsored nofollow"
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-clipupp-primary px-2.5 text-[13.5px] font-semibold text-clipupp-primary-fg transition-colors hover:bg-clipupp-primary-strong"
          >
            <span className="truncate">{t("buy", { store: displayShortName(store.name) })}</span>
          </a>
        </div>
      </div>
    </article>
  );
}
