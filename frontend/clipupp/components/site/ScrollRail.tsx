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
  arrowAnchorTop,
  edgeFade = false,
}: {
  children: ReactNode;
  ariaLabel?: string;
  variant?: Variant;
  showDots?: boolean;
  className?: string;
  /** Vertical position of the arrow buttons, measured from the top of the
   *  rail container in pixels. Use it when the rail's children render extra
   *  content below the visual "tile" (e.g. TrendingStoresRail: 88 px logo
   *  tile + a deal-label paragraph below) so the arrow centres on the tile,
   *  not the whole item. Defaults to 50% (rail centre). */
  arrowAnchorTop?: number;
  /** When true, applies a CSS mask-image to the SCROLLING div only (not the
   *  parent), so the left + right edges of the card list fade into the
   *  background. The arrow buttons sit on the parent and are unaffected. */
  edgeFade?: boolean;
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

  // Buttons strip the white pill / border / shadow — they're just the
  // chevron icon now. The edge fade behind them does the visual lifting,
  // and the chevron itself is bumped to a larger stroke so it reads clearly
  // without chrome.
  const useCustomTop = typeof arrowAnchorTop === "number";
  const arrowPos = {
    left: `absolute left-0 -translate-x-1/2 -translate-y-1/2 ${useCustomTop ? "" : "top-1/2"}`,
    right: `absolute right-0 translate-x-1/2 -translate-y-1/2 ${useCustomTop ? "" : "top-1/2"}`,
  };
  const arrowTopStyle = useCustomTop ? { top: arrowAnchorTop } : undefined;
  const buttonClass =
    "z-dropdown hidden h-9 w-9 place-items-center rounded-full bg-transparent text-clipupp-neutral-700 transition-colors hover:text-clipupp-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary disabled:cursor-not-allowed disabled:opacity-0 md:grid";

  // Edge fade is computed dynamically: only the side(s) with scrollable
  // content get faded. At the very start of the rail (canLeft false) the
  // left edge stays solid so the first card isn't ghosted; same on the
  // right when there's nothing further to scroll to.
  const maskImage = edgeFade
    ? `linear-gradient(to right, ${canLeft ? "transparent 0%, black 4%" : "black 0%, black 0%"}, ${canRight ? "black 96%, transparent 100%" : "black 100%, black 100%"})`
    : undefined;

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll("left")}
          disabled={!canLeft}
          className={`${arrowPos.left} ${buttonClass}`}
          style={arrowTopStyle}
        >
          <ChevronLeft className="h-6 w-6" aria-hidden strokeWidth={2.5} />
        </button>

        <div
          ref={railRef}
          aria-label={ariaLabel}
          className={`clipupp-no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2 ${className}`}
          style={
            maskImage
              ? { maskImage, WebkitMaskImage: maskImage }
              : undefined
          }
        >
          {children}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll("right")}
          disabled={!canRight}
          className={`${arrowPos.right} ${buttonClass}`}
          style={arrowTopStyle}
        >
          <ChevronRight className="h-6 w-6" aria-hidden strokeWidth={2.5} />
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
                  ? "w-6 bg-clipupp-primary"
                  : "w-2 bg-clipupp-neutral-300 hover:bg-clipupp-neutral-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
