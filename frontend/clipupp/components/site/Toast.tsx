"use client";

import { Check, CircleAlert } from "lucide-react";
import { withToast } from "@/lib/toast/bus";

const DURATION = 2300;

/**
 * Neutral confirmation pill (check icon, 2300ms, role="status"). The toaster
 * loads on the first call (`ToasterHost`); calls made before it mounts are
 * queued and shown once it has.
 */
export function notify(message: string): void {
  withToast((toast) =>
    toast.custom(
      () => (
        <div role="status" className={PILL}>
          <Check size={16} aria-hidden className="shrink-0" />
          <span>{message}</span>
        </div>
      ),
      { duration: DURATION },
    ),
  );
}

/** Failure pill; same shape, error icon. */
export function notifyError(message: string): void {
  withToast((toast) =>
    toast.custom(
      () => (
        <div role="status" className={PILL}>
          <CircleAlert size={16} aria-hidden className="shrink-0" />
          <span>{message}</span>
        </div>
      ),
      { duration: DURATION },
    ),
  );
}

// Pill chrome (ink fill, radius, shadow) comes from the Toaster toast class.
const PILL = "flex items-center gap-2";
