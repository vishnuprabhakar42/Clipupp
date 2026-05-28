"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type Variant = "inline" | "pills";

/**
 * Live countdown to a coupon's expiry. Updates every minute (or every second
 * when the deadline is under a minute away). Returns `null` if the coupon
 * has no expiry or already expired more than a day ago.
 *
 * Variants:
 * - "inline" (default): single rounded pill. Used in row cards + meta lines.
 * - "pills": split DD:HH:MM:SS dark digit pills with amber colons. Used in
 *   hero strips on coupon detail pages. Switches to red when <2h remain.
 */
export function CouponCountdown({
  expiresAt,
  variant = "inline",
}: {
  expiresAt: string | null;
  variant?: Variant;
}) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const remaining = target - Date.now();
    const interval = remaining < 60_000 ? 1000 : 60_000;
    const id = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(id);
  }, [target]);

  if (!target) return null;
  const diff = target - now;
  if (diff < -86_400_000) return null;

  const expired = diff <= 0;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1_000);
  const urgent = !expired && diff < 7_200_000; // under 2h

  if (variant === "pills") {
    const cells: Array<{ label: string; value: number }> = [
      { label: "D", value: Math.max(0, days) },
      { label: "H", value: Math.max(0, hours) },
      { label: "M", value: Math.max(0, mins) },
      { label: "S", value: Math.max(0, secs) },
    ];
    const cellBg = expired
      ? "bg-cv-danger text-cv-danger-fg"
      : urgent
        ? "bg-cv-danger text-cv-danger-fg"
        : "bg-cv-neutral-900 text-white";
    return (
      <div
        className="inline-flex items-center gap-1.5"
        role="timer"
        aria-live={urgent ? "polite" : "off"}
        aria-label={
          expired
            ? "Expired"
            : `${days}d ${hours}h ${mins}m ${secs}s remaining`
        }
      >
        {cells.map((cell, i) => (
          <span key={cell.label} className="flex items-center gap-1.5">
            <span
              className={`grid h-10 w-10 place-items-center rounded-md font-display text-[15px] font-extrabold tabular-nums ${cellBg}`}
            >
              {cell.value.toString().padStart(2, "0")}
            </span>
            {i < cells.length - 1 && (
              <span
                aria-hidden
                className="font-display text-[18px] font-extrabold text-cv-accent-500"
              >
                :
              </span>
            )}
          </span>
        ))}
      </div>
    );
  }

  let label: string;
  if (expired) label = "Expired";
  else if (days >= 2) label = `${days} days left`;
  else if (days === 1) label = `1 day, ${hours}h left`;
  else if (hours >= 1) label = `${hours}h ${mins}m left`;
  else if (mins >= 1) label = `${mins}m ${secs}s left`;
  else label = `${secs}s left`;

  const tone = expired
    ? "bg-cv-danger-soft text-cv-danger-strong"
    : urgent
      ? "bg-cv-danger-soft text-cv-danger-strong animate-pulse-dot"
      : diff < 86_400_000
        ? "bg-cv-accent-soft text-cv-accent-700"
        : "bg-cv-success-soft text-cv-success-strong";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}
      role="timer"
      aria-live={urgent ? "polite" : "off"}
    >
      <Clock className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
