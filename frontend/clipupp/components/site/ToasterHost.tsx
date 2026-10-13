"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isToasterWanted, subscribeToasterWanted } from "@/lib/toast/bus";

const LazyToasterMount = dynamic(() => import("@/components/site/ToasterMount").then((m) => m.ToasterMount), {
  ssr: false,
  loading: () => null,
});

/**
 * Mounted once in the locale root layout. Keeps sonner out of the first-load
 * bundle: the toaster loads on the first `notify()`/`notifyError()` call, or
 * once the page is idle after load, so forms that call sonner's `toast`
 * directly still have a toaster by the time anyone submits them.
 */
export function ToasterHost() {
  const wanted = useSyncExternalStore(subscribeToasterWanted, isToasterWanted, () => false);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let cancel = () => {};
    const schedule = () => {
      if ("requestIdleCallback" in window) {
        const id = window.requestIdleCallback(() => setIdle(true), { timeout: 4000 });
        cancel = () => window.cancelIdleCallback(id);
      } else {
        const id = setTimeout(() => setIdle(true), 2000);
        cancel = () => clearTimeout(id);
      }
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      cancel();
    };
  }, []);

  return wanted || idle ? <LazyToasterMount /> : null;
}
