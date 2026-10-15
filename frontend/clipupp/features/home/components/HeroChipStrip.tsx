"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useScrollEdges } from "@/lib/home/useScrollEdges";

/**
 * Hero "Popular" chip row. Scrolls below lg (edge to edge on phones, inside
 * the copy column from md) with the shared `.clipupp-fades` edge fades on a
 * side that has more chips; wraps at lg, where nothing overflows and no fade shows.
 */
export function HeroChipStrip({
  ariaLabel,
  className = "",
  style,
  children,
}: {
  ariaLabel: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const row = useRef<HTMLDivElement>(null);
  const { atStart, atEnd } = useScrollEdges(row);
  return (
    <div
      className={`clipupp-fades ${className}`}
      style={{ "--clipupp-fade": "var(--clipupp-tint-50)", ...style } as CSSProperties}
      data-start={atStart ? "" : undefined}
      data-end={atEnd ? "" : undefined}
    >
      <div
        ref={row}
        role="group"
        aria-label={ariaLabel}
        className="clipupp-no-scrollbar flex items-center gap-2 overflow-x-auto px-4 sm:px-6 md:px-0 lg:flex-wrap lg:overflow-visible"
      >
        {children}
      </div>
    </div>
  );
}
