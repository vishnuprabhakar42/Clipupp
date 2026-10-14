/** Today's coupons view state as it appears in the homepage URL (`?tab=&sort=&store=`). */
export type TodayParams = { tab: string; sort: string; store: string | null };

export const TODAY_KEYS = ["tab", "sort", "store"] as const;
const DEFAULTS = { tab: "all", sort: "pop" };
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;

/** Read the view state, falling back to the defaults on unknown or malformed values. */
export function parseTodayParams(sp: URLSearchParams, known: { tabs: string[]; sorts: string[] }): TodayParams {
  const tab = sp.get("tab");
  const sort = sp.get("sort");
  const store = sp.get("store");
  return {
    tab: tab && known.tabs.includes(tab) ? tab : DEFAULTS.tab,
    sort: sort && known.sorts.includes(sort) ? sort : DEFAULTS.sort,
    store: store && SLUG.test(store) ? store : null,
  };
}

/**
 * Serialise the view state, leaving out default values; "" when everything is
 * default. Other params in `base` (utm tags and the like) are kept.
 */
export function todayParamsToSearch(
  state: TodayParams,
  defaults: { tab: string; sort: string } = DEFAULTS,
  base?: URLSearchParams,
): string {
  const sp = new URLSearchParams(base);
  for (const k of TODAY_KEYS) sp.delete(k);
  if (state.tab !== defaults.tab) sp.set("tab", state.tab);
  if (state.sort !== defaults.sort) sp.set("sort", state.sort);
  if (state.store) sp.set("store", state.store);
  const s = sp.toString();
  return s ? `?${s}` : "";
}
