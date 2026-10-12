"use client";

import { ChevronUp } from "lucide-react";

/** Scrolls to the top on any page; the href keeps it a real anchor without JS. */
export function BackToTop({ label }: { label: string }) {
  return (
    <a
      href="#top"
      onClick={(e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }}
      className="inline-flex items-center gap-1.5 rounded text-[13px] text-clipupp-ft-ink-2 hover:text-clipupp-ft-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clipupp-ft-accent"
    >
      {label}
      <ChevronUp className="h-4 w-4" aria-hidden />
    </a>
  );
}
