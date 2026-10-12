/**
 * Compact relative time for trust lines ("Verified 2h ago"). Returns null for
 * missing or unparseable input so callers can omit the line entirely instead
 * of rendering "NaN". Future timestamps (clock skew) read as "just now".
 */
export function timeAgo(iso: string | null | undefined, now: Date = new Date()): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const diffSec = Math.max(0, Math.floor((now.getTime() - t) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
