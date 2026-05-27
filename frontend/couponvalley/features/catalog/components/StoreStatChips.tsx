import { Tag, Ticket, Truck, Store as StoreIcon } from "lucide-react";

export type StoreStatsInput = {
  totalOffers?: number | null;
  couponCodes?: number | null;
  inStoreCoupons?: number | null;
  freeShippingDeals?: number | null;
};

/**
 * Inline strip of 4 stat chips for the store-detail hero. Pure server
 * render; numbers come from the store's nested `stats` payload. Each chip
 * is muted-neutral chrome with a single coloured icon — no chip soup.
 */
export function StoreStatChips({ stats }: { stats?: StoreStatsInput | null }) {
  if (!stats) return null;
  const items = [
    { icon: Tag, label: "Total offers", value: stats.totalOffers ?? 0 },
    { icon: Ticket, label: "Promo codes", value: stats.couponCodes ?? 0 },
    { icon: Truck, label: "Free shipping", value: stats.freeShippingDeals ?? 0 },
    { icon: StoreIcon, label: "In-store", value: stats.inStoreCoupons ?? 0 },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-2 sm:gap-3">
      {items.map(({ icon: Icon, label, value }) => (
        <li
          key={label}
          className="inline-flex items-center gap-2 rounded-full border border-cv-neutral-200 bg-white px-3 py-1.5 text-[13px]"
        >
          <Icon className="h-3.5 w-3.5 text-cv-primary" aria-hidden />
          <span className="font-semibold tabular-nums text-cv-neutral-900">
            {value.toLocaleString()}
          </span>
          <span className="text-cv-neutral-500">{label}</span>
        </li>
      ))}
    </ul>
  );
}
