function oneDecimal(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

/**
 * Compact count for stat chips: 276, 6.4K, 12K, 89K, 1.2M. Rounds to the
 * nearest displayed unit.
 */
export function shortCount(n: number): string {
  if (n < 1000) return String(Math.round(n));
  if (n < 10_000) return `${oneDecimal(n / 1000)}K`;
  if (n < 1_000_000) {
    const k = Math.round(n / 1000);
    return k >= 1000 ? "1M" : `${k}K`;
  }
  return `${oneDecimal(n / 1_000_000)}M`;
}
