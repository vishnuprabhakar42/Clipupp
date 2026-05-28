import { CouponSavingsRowCard } from "./CouponSavingsRowCard";
import { EmptyState } from "@/components/site/EmptyState";
import type { CouponSummary } from "@/lib/api/types";

/**
 * Vertical list of coupons using the new server-rendered row card. List
 * presentation (one full-width card per row) is what couponers actually
 * scan — the old 4-col tile grid was harder to read and made every
 * "Get code" CTA the same small target.
 *
 * Empty state uses the shared EmptyState primitive so /coupons, /offers,
 * /search, etc. all surface "nothing here" consistently.
 */
export function CouponList({
  coupons,
  emptyLabel = "No coupons yet.",
  emptyDescription,
}: {
  coupons: CouponSummary[];
  emptyLabel?: string;
  emptyDescription?: string;
}) {
  if (coupons.length === 0) {
    return <EmptyState title={emptyLabel} description={emptyDescription} />;
  }
  return (
    <ul className="space-y-4">
      {coupons.map((coupon) => (
        <li key={coupon.id}>
          <CouponSavingsRowCard coupon={coupon} />
        </li>
      ))}
    </ul>
  );
}
