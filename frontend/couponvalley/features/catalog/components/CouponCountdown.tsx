"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

/**
 * Live countdown to a coupon's expiry. Updates every minute (or every second
 * when the deadline is under a minute away). Returns `null` if the coupon
 * has no expiry or already expired more than a day ago — we don't want to
 * shout about long-dead deals.
 */
export function CouponCountdown({ expiresAt }: { expiresAt: string | null }) {
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

  let label: string;
  if (expired) label = "Expired";
  else if (days >= 2) label = `${days} days left`;
  else if (days === 1) label = `1 day, ${hours}h left`;
  else if (hours >= 1) label = `${hours}h ${mins}m left`;
  else if (mins >= 1) label = `${mins}m ${secs}s left`;
  else label = `${secs}s left`;

  const tone = expired
    ? "border-cv-accent/30 bg-cv-accent-soft text-cv-accent-strong"
    : diff < 24 * 3_600_000
      ? "border-cv-accent/30 bg-cv-accent-soft text-cv-accent-strong"
      : "border-cv-success/30 bg-cv-success-soft text-cv-success-strong";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${tone}`}
      role="timer"
      aria-live={expired ? "polite" : "off"}
    >
      <Clock className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
