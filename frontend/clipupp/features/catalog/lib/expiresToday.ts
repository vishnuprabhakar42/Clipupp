const IST_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** True when the coupon expires later today in India Standard Time. */
export function expiresToday(iso: string | null, now: Date = new Date()): boolean {
  if (!iso) return false;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime()) || t.getTime() <= now.getTime()) return false;
  return IST_DAY.format(t) === IST_DAY.format(now);
}
