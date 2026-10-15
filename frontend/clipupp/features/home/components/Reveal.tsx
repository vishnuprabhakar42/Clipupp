"use client";

import { useRef, type ReactNode } from "react";
import { useReveal } from "@/lib/motion/useReveal";

/**
 * Client boundary that owns the page's scroll-reveal observer. Children are
 * server components; this wrapper adds no markup beyond one div.
 */
export function RevealRoot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  return <div ref={ref}>{children}</div>;
}
