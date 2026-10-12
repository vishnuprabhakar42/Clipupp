"use client";

import { Check, CircleAlert } from "lucide-react";
import { toast } from "sonner";

const DURATION = 2300;

/** Neutral confirmation pill (check icon, 2300ms, role="status"). */
export function notify(message: string) {
  return toast.custom(
    () => (
      <div role="status" className={PILL}>
        <Check size={16} aria-hidden className="shrink-0" />
        <span>{message}</span>
      </div>
    ),
    { duration: DURATION }
  );
}

/** Failure pill; same shape, error icon. */
export function notifyError(message: string) {
  return toast.custom(
    () => (
      <div role="status" className={PILL}>
        <CircleAlert size={16} aria-hidden className="shrink-0" />
        <span>{message}</span>
      </div>
    ),
    { duration: DURATION }
  );
}

// Pill chrome (ink fill, radius, shadow) comes from the Toaster toast class.
const PILL = "flex items-center gap-2";
