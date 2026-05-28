"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation, m, MotionConfig } from "framer-motion";

/**
 * PageEntrance — subtle fade + 8px slide-up wrapper for top-of-page content.
 *
 * Uses Framer Motion's LazyMotion + the lightweight `m` component instead of
 * the full `motion.div` so the route bundle picks up ~5 kB of dom-animation
 * features rather than the entire ~30 kB motion runtime. MotionConfig reads
 * the user's `prefers-reduced-motion` setting and disables animation when set
 * — that path returns the children as-is, no transform.
 *
 * Apply ONCE near the top of a page (typically wrapping the hero section), not
 * on every card. Cascading entrances cost more than they earn.
 */
export function PageEntrance({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.32,
            delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {children}
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
