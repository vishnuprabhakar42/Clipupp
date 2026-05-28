"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Variant = "chevron" | "arrow";

/**
 * Tiny client island — wraps a horizontally-scrolling rail (server-rendered
 * children) with optional desktop arrow buttons. The cards inside are pure
 * server HTML; only the arrow tracking is JS. CSS scroll-snap means the rail
 * works fine without JS (the arrows just don't appear until hydration).
 *
 * Variants:
 *   `chevron`  Inline arrows that sit near the rail edges (TrendingStoresRail
 *              pattern).
 *   `arrow`    Floating arrows that overlay the rail edges (TrustedBrandsRail
 *              pattern, includes dot pagination underneath).
 */
export function ScrollRail({
  children,
  ariaLabel,
  variant = "chevron",
  showDots = false,
  className = "",
}: {
  children: ReactNode;
  ariaLabel?: string;
  variant?: Variant;
  showDots?: boolean;
  className?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () => {
      const total = el.scrollWidth;
      const viewport = el.clientWidth;
      const max = total - viewport;
      setCanLeft(el.scrollLeft > 2);
      setCanRight(el.scrollLeft < max - 2);
      if (showDots) {
        const p = viewport > 0 ? Math.max(1, Math.ceil(total / viewport)) : 1;
        const current = viewport > 0 ? Math.round(el.scrollLeft / viewport) : 0;
        setPages(p);
        setPage(Math.min(current, p - 1));
      }
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [children, showDots]);

  function scroll(dir: "left" | "right") {
    const el = railRef.current;
    if (!el) return;
    if (showDots) {
      el.scrollBy({
        left: dir === "right" ? el.clientWidth : -el.clientWidth,
        behavior: "smooth",
      });
      return;
    }
    const step = Math.max(240, Math.round(el.clientWidth * 0.75));
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  }

  function goTo(p: number) {
    const el = railRef.current;
    if (!el) return;
    el.scrollTo({ left: p * el.clientWidth, behavior: "smooth" });
  }

  const arrowPos =
    variant === "chevron"
      ? { left: "absolute -left-3 top-1/2 -translate-y-1/2", right: "absolute -right-3 top-1/2 -translate-y-1/2" }
      : { left: "absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", right: "absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2" };
  // White pill with a clear slate-300 border, lifted shadow, and the brand
  // purple icon. Hovers to a soft primary fill + stronger lift. Visible at
  // rest without dominating the rail; matches the affordance vocabulary of
  // the rest of the page (single primary colour, restrained shadow tier).
  const buttonClass =
    "z-dropdown hidden h-11 w-11 place-items-center rounded-full border border-cv-neutral-300 bg-white text-cv-primary-700 shadow-lifted transition-all hover:bg-cv-primary-soft hover:text-cv-primary-800 hover:shadow-modal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-primary disabled:cursor-not-allowed disabled:opacity-0 md:grid";

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll("left")}
          disabled={!canLeft}
          className={`${arrowPos.left} ${buttonClass}`}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden strokeWidth={2.25} />
        </button>

        <div
          ref={railRef}
          aria-label={ariaLabel}
          className={`cv-no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2 ${className}`}
        >
          {children}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll("right")}
          disabled={!canRight}
          className={`${arrowPos.right} ${buttonClass}`}
        >
          <ChevronRight className="h-5 w-5" aria-hidden strokeWidth={2.25} />
        </button>
      </div>

      {showDots && pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1}`}
              aria-current={i === page ? "page" : undefined}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === page
                  ? "w-6 bg-cv-primary"
                  : "w-2 bg-cv-neutral-300 hover:bg-cv-neutral-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
