"use client";

import { useEffect, useState, type RefObject } from "react";
import { edges, type ScrollEdges } from "./scrollEdges";

/** Both edges until measured, so the server render and first paint show no fades. */
const NONE: ScrollEdges = { atStart: true, atEnd: true };

/** Live scroll edges of a horizontal scroller; re-measures on scroll and resize. */
export function useScrollEdges(ref: RefObject<HTMLElement | null>): ScrollEdges {
  const [state, setState] = useState<ScrollEdges>(NONE);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const next = edges(el.scrollLeft, el.scrollWidth, el.clientWidth);
      setState((prev) => (prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next));
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    // Content width changes (web fonts, a chip appearing) without a window resize.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [ref]);
  return state;
}
