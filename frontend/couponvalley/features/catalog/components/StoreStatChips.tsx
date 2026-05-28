import { Tag, Ticket, Truck, Store as StoreIcon } from "lucide-react";

export type StoreStatsInput = {
  totalOffers?: number | null;
  couponCodes?: number | null;
  inStoreCoupons?: number | null;
  freeShippingDeals?: number | null;
};

/**
 * Inline strip of 4 stat chips for the store-detail hero.
 * - `default` variant: white pill with neutral border. Used when the chips
 *   sit on a light background.
 * - `glass` variant: white/15 + backdrop-blur. Used when the chips sit on a
 *   dark gradient mesh hero (StoreHero).
 *
 * Pure server render; numbers come from the store's nested `stats` payload.
 */
export function StoreStatChips({
  stats,
  variant = "default",
}: {
  stats?: StoreStatsInput | null;
  variant?: "default" | "glass";
}) {
  if (!stats) return null;
  const items = [
    { icon: Tag, label: "Total offers", value: stats.totalOffers ?? 0 },
    { icon: Ticket, label: "Promo codes", value: stats.couponCodes ?? 0 },
    { icon: Truck, label: "Free shipping", value: stats.freeShippingDeals ?? 0 },
    { icon: StoreIcon, label: "In-store", value: stats.inStoreCoupons ?? 0 },
  ];
  const isGlass = variant === "glass";
  const chipClass = isGlass
    ? "inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[13px] backdrop-blur-sm"
    : "inline-flex items-center gap-2 rounded-full border border-cv-neutral-200 bg-white px-3 py-1.5 text-[13px]";
  const iconClass = isGlass
    ? "h-3.5 w-3.5 text-cv-accent-400"
    : "h-3.5 w-3.5 text-cv-primary-700";
  const numClass = isGlass
    ? "font-display font-extrabold tabular-nums text-white"
    : "font-semibold tabular-nums text-cv-neutral-900";
  const labelClass = isGlass ? "text-white/80" : "text-cv-neutral-500";
  return (
    <ul className="flex flex-wrap items-center gap-2 sm:gap-3">
      {items.map(({ icon: Icon, label, value }) => (
        <li key={label} className={chipClass}>
          <Icon className={iconClass} aria-hidden />
          <span className={numClass}>{value.toLocaleString()}</span>
          <span className={labelClass}>{label}</span>
        </li>
      ))}
    </ul>
  );
}
