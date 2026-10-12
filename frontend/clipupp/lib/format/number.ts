const enIN = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** Indian digit grouping for counters and prices: 1,29,999. */
export function formatCount(n: number): string {
  return enIN.format(n);
}
