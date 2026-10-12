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
  return istDayNumber(new Date(dateISO));
}

/**
 * "Diwali in 27 days", "Diwali is tomorrow", "Happy Diwali!" on the day,
 * null after it. Days are IST calendar days.
 */
export function festivalLabel(name: string, dateISO: string, now: Date = new Date()): string | null {
  const diff = dayNumberOf(dateISO) - istDayNumber(now);
  if (Number.isNaN(diff) || diff < 0) return null;
  if (diff === 0) return `Happy ${name}!`;
  if (diff === 1) return `${name} is tomorrow`;
  return `${name} in ${diff} days`;
}
