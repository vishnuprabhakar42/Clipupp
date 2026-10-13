"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Sliding underline for a tablist. Render it as the last child of the
 * `role="tablist"` element (which must be `position: relative`); it reads the
 * `[aria-selected="true"]` tab from the DOM, so the list only passes the
 * selected key (null hides the ink). Re-measures when tabs resize, are added
 * or removed, and on window resize.
 */
export function TabInk({ selected }: { selected: string | null }) {
  const ink = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ink.current;
    const list = el?.parentElement;
    if (!el || !list) return;
    const place = () => {
      const tab = selected == null ? null : list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!tab) {
        el.style.opacity = "0";
        return;
      }
      el.style.opacity = "1";
      el.style.width = `${tab.offsetWidth}px`;
      el.style.transform = `translateX(${tab.offsetLeft}px)`;
    };
    place();
    // Animate only moves after the first placement, never the mount.
    const raf = requestAnimationFrame(() => el.setAttribute("data-ready", ""));
    const ro = new ResizeObserver(place);
    list.querySelectorAll('[role="tab"]').forEach((t) => ro.observe(t));
    const mo = new MutationObserver(place);
    mo.observe(list, { childList: true });
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [selected]);

  return <span ref={ink} aria-hidden className="clipupp-tab-ink" />;
}
