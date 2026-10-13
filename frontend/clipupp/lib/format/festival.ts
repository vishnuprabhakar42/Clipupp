const ymd = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** IST calendar day as a day number (days since epoch, calendar-based). */
function istDayNumber(d: Date): number {
  const [y, m, day] = ymd.format(d).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, day) / 86_400_000);
}

function dayNumberOf(dateISO: string): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    const [y, m, d] = dateISO.split("-").map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
  }
  const d = new Date(dateISO);
  return Number.isNaN(d.getTime()) ? NaN : istDayNumber(d);
}

/**
 * IST calendar days from now until the festival: 0 on the day, 1 the day
 * before, null once it has passed (or for an unreadable date). The strip
 * turns this into copy through the `strip.festival` message.
 */
export function festivalDaysAway(dateISO: string, now: Date = new Date()): number | null {
  const diff = dayNumberOf(dateISO) - istDayNumber(now);
  return Number.isNaN(diff) || diff < 0 ? null : diff;
}
