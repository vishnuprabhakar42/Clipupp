"use client";

import { useEffect } from "react";

/**
 * Adds `.in` to every `.clipupp-reveal` under `root` as it enters the
 * viewport. One observer per page; stagger is capped at 6 through the
 * `--i` custom property each element sets itself. Under reduced motion,
 * or without IntersectionObserver, everything is shown immediately.
 * A 2.5s safety timer reveals anything still hidden (fast scroll, tabs
 * rendered off-screen, etc.) so content can never be lost.
 */
export function useReveal(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(".clipupp-reveal"));
    if (items.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const showAll = () => items.forEach((i) => i.classList.add("in"));
    if (reduce || !("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((i) => io.observe(i));
    const safety = window.setTimeout(showAll, 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, [root]);
}
