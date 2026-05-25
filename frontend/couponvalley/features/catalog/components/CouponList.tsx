import { CouponSavingsCard } from "./CouponSavingsCard";
import type { CouponSummary } from "@/lib/api/types";

export function CouponList({
  coupons,
  emptyLabel = "No coupons yet.",
}: {
  coupons: CouponSummary[];
  emptyLabel?: string;
}) {
  if (coupons.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {coupons.map((coupon) => (
        <li key={coupon.id} className="contents">
          <CouponSavingsCard coupon={coupon} />
        </li>
      ))}
    </ul>
  );
}
