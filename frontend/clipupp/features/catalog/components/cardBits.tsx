import { Check } from "lucide-react";
import type { ReactNode } from "react";

/** Desktop hover lift shared by coupon cards and rows (no motion when reduced). */
export const CARD_HOVER =
  "transition-[transform,box-shadow] duration-200 motion-reduce:transition-none lg:hover:-translate-y-[3px] lg:hover:shadow-clipupp-hover motion-reduce:lg:hover:translate-y-0";

/** Coupon title link to the detail page: inherits the heading style, brand colour on hover, visible focus ring. */
export const TITLE_LINK =
  "rounded-sm transition-colors hover:text-clipupp-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clipupp-primary";

const TAG_TONE = {
  ok: "bg-clipupp-ok-bg text-clipupp-ok-fg",
  gold: "bg-clipupp-deep text-clipupp-gold",
  bad: "bg-clipupp-bad-bg text-clipupp-danger",
} as const;

/** Small status tag (design `.tag`): verified (ok, with a check), Exclusive (gold), Ends today (bad). Server-safe, no hooks. */
export function Tag({ tone, children }: { tone: keyof typeof TAG_TONE; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[5px] px-[7px] py-[5px] text-[11px] font-semibold leading-none ${TAG_TONE[tone]}`}>
      {tone === "ok" && <Check className="h-3 w-3" strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </span>
  );
}
