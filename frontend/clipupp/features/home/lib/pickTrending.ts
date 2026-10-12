import type { ReactNode } from "react";

export type TrendingEntry = { id: string; cat: string | null; trending: number | null; node: ReactNode };

const MIN = 4;
const MAX = 8;

/** Trending first (rank asc); padded with non-trending of the same filter up to 4, capped at 8. */
export function pickTrending(entries: TrendingEntry[], cat: string): TrendingEntry[] {
  const scoped = entries.filter((e) => cat === "all" || e.cat === cat);
  const ranked = scoped.filter((e) => e.trending != null).sort((a, b) => (a.trending ?? 0) - (b.trending ?? 0));
  const pad = ranked.length < MIN ? scoped.filter((e) => e.trending == null) : [];
  return [...ranked, ...pad].slice(0, MAX);
}
