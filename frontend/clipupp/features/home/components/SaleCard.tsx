import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { StoreTile } from "@/features/catalog/components/StoreTile";
import type { FeedSale, FeedStore } from "@/lib/home/feed";
import { saleDateRange, type SaleState } from "@/lib/home/saleState";
import { RemindMeButton } from "./RemindMeButton";
import { StoreFilterButton } from "./StoreFilterButton";

const HOVER =
  "transition-[transform,box-shadow] duration-200 motion-reduce:transition-none lg:hover:-translate-y-[3px] lg:hover:shadow-clipupp-hover motion-reduce:lg:hover:translate-y-0";

export async function SaleCard({ sale, store, state }: { sale: FeedSale; store: FeedStore; state: SaleState }) {
  const t = await getTranslations("home.calendar");
  const live = state === "live";
  return (
    <article
      data-sale-card
      data-state={state}
      className={`is-${state} flex min-w-0 flex-col rounded-2xl border p-[18px] ${HOVER} ${
        live ? "border-clipupp-primary" : "border-clipupp-neutral-200 bg-clipupp-surface"
      } ${state === "ended" ? "opacity-60" : ""}`}
      style={live ? { background: "linear-gradient(180deg, var(--clipupp-tint-100), var(--clipupp-surface))" } : undefined}
    >
      <div className="flex items-center gap-2.5">
        <StoreTile store={store} size={36} className="!rounded-lg !p-1" />
        <span
          className={`inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] ${
            live ? "text-clipupp-primary" : "text-clipupp-neutral-500"
          }`}
        >
          {live && <span className="clipupp-pulse-dot mr-1" aria-hidden />}
          {t(state)}
        </span>
      </div>
      <h3 className="mt-3.5 font-display text-[20px] font-semibold leading-tight text-clipupp-neutral-900">{sale.name}</h3>
      <p className="mt-2 text-[14px] leading-snug text-clipupp-neutral-700">
        <b className="font-semibold text-clipupp-neutral-900">{store.name}.</b> {sale.text}
      </p>
      <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-clipupp-neutral-500">
        <CalendarDays size={14} aria-hidden />
        {saleDateRange(sale.startAt, sale.endAt)}
      </p>
      {state !== "ended" && (
        <div className="mt-auto pt-4">
          {live ? (
            <StoreFilterButton storeSlug={store.id} variant="primary">
              {t("seeCodes", { store: store.name })}
            </StoreFilterButton>
          ) : (
            <RemindMeButton saleId={sale.id} saleName={sale.name} />
          )}
        </div>
      )}
    </article>
  );
}
