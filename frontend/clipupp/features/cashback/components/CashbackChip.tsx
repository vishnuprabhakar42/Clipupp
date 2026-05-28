import { Coins } from "lucide-react";

/**
 * Small inline pill rendered on store cards + coupon cards when the store has
 * cashback enabled. Soft emerald background, emerald-strong text + icon.
 * Renders nothing when `enabled` is false or `rateBps` is 0 — never shown for
 * stores that don't offer cashback.
 *
 * Receives `rateBps` (basis points; 550 = 5.50%) from the API. Conversion to
 * percent label happens here so the API stays integer-precise.
 */
export function CashbackChip({
  rateBps,
  enabled = true,
  className = "",
  prefix = "Up to",
}: {
  rateBps: number | null | undefined;
  enabled?: boolean | null;
  className?: string;
  prefix?: string;
}) {
  if (!enabled || !rateBps || rateBps <= 0) return null;
  const pct = (rateBps / 100).toFixed(rateBps % 100 === 0 ? 0 : 1);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-clipupp-success-soft px-2.5 py-0.5 font-display text-[11px] font-bold text-clipupp-success-strong ${className}`}
      aria-label={`Cashback ${prefix} ${pct} percent`}
    >
      <Coins className="h-3 w-3" aria-hidden strokeWidth={2.5} />
      {prefix} {pct}% cashback
    </span>
  );
}
