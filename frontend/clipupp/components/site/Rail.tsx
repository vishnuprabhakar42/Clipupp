"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { create } from "zustand";

type Edges = { atStart: boolean; atEnd: boolean; scrollable: boolean };
const NO_EDGES: Edges = { atStart: true, atEnd: true, scrollable: false };

/** Tracks scroll edges per rail id so RailArrows can live anywhere on the page. */
const useRailEdges = create<{ edges: Record<string, Edges>; set: (id: string, e: Edges) => void }>(
  (set) => ({
    edges: {},
    set: (id, e) =>
      set((s) => {
        const prev = s.edges[id];
        if (prev && prev.atStart === e.atStart && prev.atEnd === e.atEnd && prev.scrollable === e.scrollable) {
          return s;
        }
        return { edges: { ...s.edges, [id]: e } };
      }),
  })
);

const EDGE_PX = 4;

function scrollRail(id: string, dir: -1 | 1) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
}

export type RailArrowsProps = {
  /** The `id` passed to the Rail this pair controls. */
  railId: string;
  className?: string;
};

function ArrowButton({
  dir,
  railId,
  disabled,
  className = "",
}: {
  dir: -1 | 1;
  railId: string;
  disabled: boolean;
  className?: string;
}) {
  const t = useTranslations("common");
  const Icon = dir < 0 ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={dir < 0 ? t("scrollLeft") : t("scrollRight")}
      aria-controls={railId}
      disabled={disabled}
      onClick={() => scrollRail(railId, dir)}
      className={`grid h-10 w-10 place-items-center rounded-full border border-clipupp-neutral-200 bg-clipupp-surface text-clipupp-neutral-900 shadow-card transition-opacity hover:bg-clipupp-neutral-50 disabled:cursor-default disabled:opacity-40 ${className}`}
    >
      <Icon size={20} aria-hidden />
    </button>
  );
}

/**
 * Left/right button pair bound to a Rail by id. Rendered lg+ only. Always
 * present (as the design shows): both disabled when every card fits.
 */
export function RailArrows({ railId, className = "" }: RailArrowsProps) {
  const e = useRailEdges((s) => s.edges[railId]) ?? NO_EDGES;
  return (
    <div className={`hidden items-center gap-2 lg:flex ${className}`}>
      <ArrowButton dir={-1} railId={railId} disabled={!e.scrollable || e.atStart} />
      <ArrowButton dir={1} railId={railId} disabled={!e.scrollable || e.atEnd} />
    </div>
  );
}

export type RailProps = {
  id: string;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  /** CSS width expressions per breakpoint: sm = 640px+, lg = 1024px+. */
  cols: { base: string; sm?: string; lg?: string };
  /** Gap in px. A number applies to all sizes; default 16 base, 24 lg. */
  gap?: number | { base?: number; lg?: number };
  /** Show arrows (lg+). Default true. */
  arrows?: boolean;
  /** "header": caller renders <RailArrows railId={id} />. "overlay": arrows sit on the rail edges. */
  arrowsPlacement?: "header" | "overlay";
  /** When this changes (e.g. a filter chip), the track scrolls back to the start. */
  resetKey?: string;
};

export function Rail({
  id,
  ariaLabel,
  children,
  className = "",
  cols,
  gap,
  arrows = true,
  arrowsPlacement = "header",
  resetKey,
}: RailProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const setEdges = useRailEdges((s) => s.set);
  const edges = useRailEdges((s) => s.edges[id]) ?? NO_EDGES;

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges(id, {
      scrollable: max > EDGE_PX,
      atStart: el.scrollLeft <= EDGE_PX,
      atEnd: el.scrollLeft >= max - EDGE_PX,
    });
  }, [id, setEdges]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, children]);

  useEffect(() => {
    const el = trackRef.current;
    if (el && el.scrollLeft !== 0) el.scrollLeft = 0;
  }, [resetKey]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const el = trackRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    e.preventDefault();
    const g = parseFloat(getComputedStyle(el).columnGap) || 0;
    const dir = e.key === "ArrowLeft" ? -1 : 1;
    el.scrollBy({ left: dir * (first.offsetWidth + g), behavior: "smooth" });
  };

  const gapBase = typeof gap === "number" ? gap : gap?.base;
  const gapLg = typeof gap === "number" ? gap : gap?.lg;
  const style = {
    "--rail-col-base": cols.base,
    ...(cols.sm ? { "--rail-col-sm": cols.sm } : null),
    ...(cols.lg ? { "--rail-col-lg": cols.lg } : null),
    ...(gapBase != null ? { "--rail-gap-base": `${gapBase}px` } : null),
    ...(gapLg != null ? { "--rail-gap-lg": `${gapLg}px` } : null),
  } as CSSProperties;

  const overlay = arrows && arrowsPlacement === "overlay" && edges.scrollable;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        id={id}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={`clipupp-rail ${className}`}
        style={style}
      >
        {children}
      </div>
      {overlay ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden items-center lg:flex">
            <ArrowButton dir={-1} railId={id} disabled={edges.atStart} className="pointer-events-auto -translate-x-1/2" />
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center lg:flex">
            <ArrowButton dir={1} railId={id} disabled={edges.atEnd} className="pointer-events-auto translate-x-1/2" />
          </div>
        </>
      ) : null}
    </div>
  );
}
