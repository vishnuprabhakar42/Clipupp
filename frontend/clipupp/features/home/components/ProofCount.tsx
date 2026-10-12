import { formatCount } from "@/lib/format/number";

/**
 * A number in the hero proof line, formatted with Indian digit grouping.
 * Static on purpose: a count-up re-rendered the server number from 0 after
 * hydration, so slow phones saw "1,204" jump back to "0".
 */
export function ProofCount({ value }: { value: number }) {
  return <b className="font-semibold text-clipupp-neutral-900 tabular-nums">{formatCount(value)}</b>;
}
