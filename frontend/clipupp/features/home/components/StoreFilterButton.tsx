"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { emit } from "@/lib/home/homeBus";

/**
 * Filters Today's coupons to one store and scrolls to the list.
 * `bank` is the card footer link; `primary` is the filled call to action.
 */
export function StoreFilterButton({
  storeSlug,
  variant,
  ariaLabel,
  children,
}: {
  storeSlug: string;
  variant: "bank" | "primary";
  ariaLabel?: string;
  children: ReactNode;
}) {
  function onClick() {
    emit("today:store", storeSlug);
    const el = document.getElementById("today");
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  if (variant === "primary") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className="clipupp-press inline-flex min-h-10 w-full items-center justify-center rounded-full bg-clipupp-primary px-4 py-2 text-center text-[15px] font-semibold leading-tight text-clipupp-primary-fg hover:bg-clipupp-primary-strong"
      >
        {/* Wraps to a second line rather than clipping a long store name. */}
        <span className="text-balance">{children}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="group flex w-full items-center gap-2 rounded-lg py-1 text-left text-[14px] font-medium text-clipupp-neutral-700 clipupp-press hover:text-clipupp-primary"
    >
      {children}
      <ChevronRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </button>
  );
}
