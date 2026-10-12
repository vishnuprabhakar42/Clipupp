"use client";

import { useEffect, useState } from "react";
import { formatCount } from "@/lib/format/number";

/**
 * Count-up for the hero proof line: 900ms easeOutCubic from 0 to `to`.
 * Renders the final number on the server (and under reduced motion) so the
 * HTML is correct before hydration; the animation only replaces it.
 */
export function ProofCount({ to }: { to: number }) {
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start: number | null = null;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);

  return <b className="font-semibold text-clipupp-neutral-900 tabular-nums">{formatCount(value)}</b>;
}
