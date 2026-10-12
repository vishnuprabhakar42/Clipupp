export type SaleState = "live" | "soon" | "ended";

type DateInput = string | Date;

export function saleState(startAt: DateInput, endAt: DateInput, now: Date = new Date()): SaleState {
  const t = now.getTime();
  if (t < new Date(startAt).getTime()) return "soon";
  if (t > new Date(endAt).getTime()) return "ended";
  return "live";
}

const dayMonth = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

function fmt(d: DateInput): string {
  // en-IN yields "2 Oct"; normalise any locale punctuation/spacing.
  return dayMonth.format(new Date(d)).replace(/\s+/g, " ").replace("Sept", "Sep");
}

/** "2 Oct to 16 Oct" in IST. */
export function saleDateRange(startAt: DateInput, endAt: DateInput): string {
  return `${fmt(startAt)} to ${fmt(endAt)}`;
}
