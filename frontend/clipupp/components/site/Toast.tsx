"use client";

import { toast } from "sonner";

/** Neutral confirmation pill (check icon, 2300ms). */
export function notify(message: string) {
  return toast(message, { duration: 2300 });
}

/** Failure pill; same shape, error icon. */
export function notifyError(message: string) {
  return toast.error(message, { duration: 2300 });
}
