"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { toastReady } from "@/lib/toast/bus";

/**
 * The sonner Toaster plus the hand-over to the toast bus. Child effects run
 * first, so the Toaster is subscribed before queued `notify()` calls flush.
 */
export function ToasterMount() {
  useEffect(() => {
    toastReady(toast);
  }, []);
  return <Toaster />;
}
