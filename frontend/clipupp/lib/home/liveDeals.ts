import type { FeedDeal } from "./feed";

function endsKey(iso: string | null): number {
  const n = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(n) ? Infinity : n;
}

/**
 * Deals the rail shows and lists in `ld-deals`: known store, not yet ended
 * (no or unparseable `endsAt` counts as open), soonest ending first. One list
 * for both, so the schema never advertises an ended deal as InStock.
 */
export function liveDeals(deals: FeedDeal[], knownStores: ReadonlySet<string>, now: number = Date.now()): FeedDeal[] {
  return deals
    .filter((d) => knownStores.has(d.store) && endsKey(d.endsAt) > now)
    .sort((a, b) => endsKey(a.endsAt) - endsKey(b.endsAt));
}
