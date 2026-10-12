import { getTranslations } from "next-intl/server";
import { StoreTile } from "@/features/catalog/components/StoreTile";
import { wrapNumbers } from "@/lib/format/wrapNumbers";
import type { FeedBankOffer, FeedStore } from "@/lib/home/feed";
import { StoreFilterButton } from "./StoreFilterButton";

const HOVER =
  "transition-[transform,box-shadow] duration-200 motion-reduce:transition-none lg:hover:-translate-y-[3px] lg:hover:shadow-clipupp-hover motion-reduce:lg:hover:translate-y-0";

export async function BankOfferCard({ offer, store }: { offer: FeedBankOffer; store: FeedStore }) {
  const t = await getTranslations("home.bank");
  return (
    <article
      data-bank-card
      className={`flex min-w-0 flex-col rounded-2xl border border-clipupp-neutral-200 bg-clipupp-surface p-[18px] ${HOVER}`}
    >
      <div
        aria-hidden
        className="relative h-16 shrink-0 overflow-hidden rounded-xl"
        style={{ background: `linear-gradient(135deg, ${offer.art[0]}, ${offer.art[1]})` }}
      >
        <span className="absolute left-3.5 top-3 text-[11px] font-semibold uppercase leading-none tracking-[0.08em] text-white">
          {offer.bank}
        </span>
        <span className="absolute bottom-3 left-3.5 h-4 w-[22px] rounded-[4px] bg-gradient-to-br from-clipupp-gold to-[#c9a03c]" />
        <span className="absolute -right-8 -top-6 h-[120px] w-[120px] rounded-full bg-white/15" />
      </div>
      <h3 className="mt-3.5 font-display text-[20px] font-semibold leading-tight text-clipupp-neutral-900">
        {wrapNumbers(offer.title)}
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-snug text-clipupp-neutral-500">{offer.terms}</p>
      <div className="mt-auto pt-4">
        <StoreFilterButton storeSlug={store.id} variant="bank" ariaLabel={t("onAria", { store: store.name })}>
          <StoreTile store={store} size={24} className="!rounded-md !p-0.5" />
          <span>{t("on", { store: store.name })}</span>
        </StoreFilterButton>
      </div>
    </article>
  );
}
