import type { ReactNode } from "react";

/** Desktop hover lift shared by coupon cards and rows (no motion when reduced). */
export const CARD_HOVER =
  "transition-[transform,box-shadow] duration-200 motion-reduce:transition-none lg:hover:-translate-y-[3px] lg:hover:shadow-clipupp-hover motion-reduce:lg:hover:translate-y-0";

const TAG_TONE = {
  ok: "bg-clipupp-ok-bg text-clipupp-success",
  gold: "bg-clipupp-deep text-clipupp-gold",
  bad: "bg-clipupp-bad-bg text-clipupp-danger",
} as const;

/** Small status tag: verified (ok), Exclusive (gold), Ends today (bad). Server-safe, no hooks. */
export function Tag({ tone, children }: { tone: keyof typeof TAG_TONE; children: ReactNode }) {
  return <span className={`rounded-md px-2 py-1 text-[11.5px] font-semibold leading-none ${TAG_TONE[tone]}`}>{children}</span>;
}
