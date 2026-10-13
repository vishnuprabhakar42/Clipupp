export type SaleState = "live" | "soon" | "ended";

type DateInput = string | Date;

export function saleState(startAt: DateInput, endAt: DateInput, now: Date = new Date()): SaleState {
  const t = now.getTime();
  if (t < new Date(startAt).getTime()) return "soon";
  if (t > new Date(endAt).getTime()) return "ended";
  return "live";
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/** "2 Oct" (en) or "2 अक्टू॰" (hi), always in IST. */
export function saleDay(d: DateInput, bcp47: string): string {
  let f = formatters.get(bcp47);
  if (!f) {
    // en has no day-month order of its own; en-IN gives "2 Oct".
    f = new Intl.DateTimeFormat(bcp47 === "en" ? "en-IN" : bcp47, { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
    formatters.set(bcp47, f);
  }
  // Normalise locale punctuation/spacing and the en-IN "Sept".
  return f.format(new Date(d)).replace(/\s+/g, " ").replace("Sept", "Sep");
}
