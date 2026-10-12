import type { CouponType } from "@/lib/api/types";

/** A coupon without a code is a deal, whatever its declared type says. */
export function ctaLabel(c: { type: CouponType; code: string | null }): "Show code" | "Get deal" {
  return c.code && c.code.trim() ? "Show code" : "Get deal";
}

/** Card headline: the savings label when present, otherwise the title. */
export function headline(c: { savingsLabel: string | null; title: string }): string {
  const label = c.savingsLabel?.trim();
  return label ? label : c.title;
}
