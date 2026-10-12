export type TimeAgo = { unit: "now" | "m" | "h" | "d"; n: number };

/**
 * Compact relative time for trust lines ("Verified 2h ago"). Returns the
 * unit and count so the caller can localize the sentence (see the
 * `catalog.card.verifiedAgo` ICU message). Returns null for missing or
 * unparseable input so callers can omit the line entirely instead of
 * rendering "NaN". Future timestamps (clock skew) read as "now".
 */
export function timeAgo(iso: string | null | undefined, now: Date = new Date()): TimeAgo | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const diffSec = Math.max(0, Math.floor((now.getTime() - t) / 1000));
  if (diffSec < 60) return { unit: "now", n: 0 };
  const min = Math.floor(diffSec / 60);
  if (min < 60) return { unit: "m", n: min };
  const hr = Math.floor(min / 60);
  if (hr < 24) return { unit: "h", n: hr };
  return { unit: "d", n: Math.floor(hr / 24) };
}
