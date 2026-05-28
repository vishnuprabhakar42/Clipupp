"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";

/**
 * Promo banner carousel client island — sliding two-up grid (desktop) /
 * snap-x rail (mobile). Slides come pre-fetched server-side (see
 * PromoBannersCarousel.tsx wrapper); this component owns only the
 * auto-rotate timer + pause-on-hover + arrow navigation.
 *
 * Per the platform's design rules we do not draw decorative gradients here:
 * the banner image itself fills the card.
 */

export type Slide = {
  id: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  imageUrl: string;
};

export function PromoBannersCarouselClient({ slides }: { slides: Slide[] }) {
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (total > 0 && index >= total) setIndex(0);
  }, [total, index]);

  useEffect(() => {
    if (total < 2 || paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 2) % total);
    }, 6500);
    const onVis = () => {
      if (document.hidden) window.clearInterval(t);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [total, paused]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex((i) => (i - 2 + total) % total);
      if (e.key === "ArrowRight") setIndex((i) => (i + 2) % total);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [total]);

  if (total === 0) return null;

  // Build pages of 2 banners each. The last page wraps back to the start so
  // each page is always full.
  const pages: Array<[Slide, Slide]> = [];
  for (let i = 0; i < total; i += 2) {
    pages.push([slides[i], slides[(i + 1) % total]]);
  }
  const pageCount = pages.length;
  const currentPageIndex = Math.min(Math.floor(index / 2), pageCount - 1);

  const goPrev = () => setIndex((i) => (i - 2 + total) % total);
  const goNext = () => setIndex((i) => (i + 2) % total);

  const currentPage = currentPageIndex + 1;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      tabIndex={0}
      ref={containerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative pt-6 outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary/40 md:pt-8"
    >
      <div className="hidden md:block">
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex will-change-transform"
              style={{
                width: `${pageCount * 100}%`,
                transform: `translate3d(-${currentPageIndex * (100 / pageCount)}%, 0, 0)`,
                transition: "transform 600ms cubic-bezier(.22,.96,.36,1)",
              }}
            >
              {pages.map(([a, b], pi) => (
                <div
                  key={pi}
                  className="grid shrink-0 items-stretch gap-4"
                  style={{
                    width: `${100 / pageCount}%`,
                    gridTemplateColumns: "1fr 1fr",
                  }}
                >
                  <MainBanner slide={a} priority={pi === 0} />
                  <MainBanner slide={b} priority={pi === 0} />
                </div>
              ))}
            </div>
          </div>

          {pageCount > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous banners"
                onClick={goPrev}
                className="absolute z-dropdown grid h-9 w-9 place-items-center rounded-full border border-clipupp-neutral-200 bg-white text-clipupp-neutral-700 shadow-card transition-colors hover:text-clipupp-neutral-900"
                style={{ left: 0, top: "50%", transform: "translate(-50%, -50%)" }}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                aria-label="Next banners"
                onClick={goNext}
                className="absolute z-dropdown grid h-9 w-9 place-items-center rounded-full border border-clipupp-neutral-200 bg-white text-clipupp-neutral-700 shadow-card transition-colors hover:text-clipupp-neutral-900"
                style={{ right: 0, top: "50%", transform: "translate(50%, -50%)" }}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>

        {pageCount > 1 && (
          <p
            className="mt-2 text-[11px] tabular-nums text-clipupp-neutral-500"
            aria-live="polite"
          >
            <span className="font-semibold text-clipupp-neutral-900">{currentPage}</span>
            <span className="mx-0.5">/</span>
            <span>{pageCount}</span>
          </p>
        )}
      </div>

      <div className="md:hidden">
        <div className="clipupp-no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1">
          {slides.map((s, i) => (
            <MainBanner key={s.id} slide={s} priority={i === 0} mobile />
          ))}
        </div>
      </div>
    </section>
  );
}

function MainBanner({
  slide,
  priority,
  mobile = false,
}: {
  slide: Slide;
  priority: boolean;
  mobile?: boolean;
}) {
  const cls = mobile
    ? "group relative block w-[88%] shrink-0 snap-start overflow-hidden rounded-lg bg-clipupp-neutral-100"
    : "group relative block overflow-hidden rounded-lg bg-clipupp-neutral-100 shadow-card";
  const height = mobile ? 220 : 280;

  return (
    <Link key={slide.id} href={slide.linkUrl} className={cls} style={{ height }}>
      {slide.imageUrl ? (
        <Image
          src={slide.imageUrl}
          alt={slide.title}
          fill
          sizes="(min-width: 1024px) 640px, 88vw"
          priority={priority}
          className="object-cover"
        />
      ) : null}
      <span className="sr-only">{slide.title}</span>
    </Link>
  );
}
