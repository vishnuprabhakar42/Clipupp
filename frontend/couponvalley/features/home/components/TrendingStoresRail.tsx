"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { storesApi } from "@/lib/api/stores";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Horizontal rail of store cards. Title + item set come from the homepage
 * layout API (admin-managed). Native scroll-snap; arrow buttons + edge fades
 * appear only when the rail can actually scroll in that direction.
 */
export function TrendingStoresRail({ section }: { section?: HomepageSectionPayload | null }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const limit = section?.itemLimit ?? 12;
  const heading = section?.title ?? "Your favorites & visited";
  const preloaded = section?.stores;

  const q = useQuery({
    queryKey: ["home", "trending-stores", limit],
    queryFn: () => storesApi.list({ limit }),
    staleTime: 5 * 60_000,
    enabled: !preloaded,
  });

  const stores = preloaded ?? q.data?.data ?? [];

  // Track scroll position so we can fade arrows + edge gradients at the ends.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setCanLeft(el.scrollLeft > 2);
      setCanRight(el.scrollLeft < max - 2);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [stores.length]);

  function scroll(dir: "left" | "right") {
    const el = railRef.current;
    if (!el) return;
    const step = Math.max(240, Math.round(el.clientWidth * 0.75));
    el.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  }

  return (
    <section aria-labelledby="trending-stores-heading" className="relative">
      <div className="mb-6 flex items-end justify-between gap-3">
        <h2
          id="trending-stores-heading"
          className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl"
        >
          {heading}
        </h2>
        <Link
          href="/stores"
          className="text-sm font-semibold text-cv-primary hover:underline"
        >
          See All
        </Link>
      </div>

      <div className="relative">
        {/* Edge fades — only when there's content to scroll into */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 z-[5] w-16 bg-gradient-to-r from-white via-white/80 to-transparent transition-opacity duration-300 ${
            canLeft ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 right-0 z-[5] w-16 bg-gradient-to-l from-white via-white/80 to-transparent transition-opacity duration-300 ${
            canRight ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Arrows — faded by default, sharpen on hover. Disabled at ends. */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll("left")}
          disabled={!canLeft}
          className={`absolute -left-3 top-[44px] z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-gray-200 bg-white/85 text-cv-neutral-500 shadow-md backdrop-blur transition-all duration-300 hover:bg-white hover:text-gray-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-0 md:grid ${
            canLeft ? "opacity-100" : ""
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll("right")}
          disabled={!canRight}
          className={`absolute -right-3 top-[44px] z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-gray-200 bg-white/85 text-cv-neutral-500 shadow-md backdrop-blur transition-all duration-300 hover:bg-white hover:text-gray-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-0 md:grid ${
            canRight ? "opacity-100" : ""
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {!preloaded && q.isLoading ? (
          <div className="flex gap-5 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0">
                <div className="cv-skeleton h-[88px] w-[220px] rounded-md" />
                <div className="cv-skeleton mt-3 h-4 w-32 rounded" />
              </div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stores yet.</p>
        ) : (
          <div
            ref={railRef}
            className="cv-no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
          >
            {stores.map((s) => {
              const bg = s.brandColor || "#1f2937";
              // `cashbackRate` on the DTO is now a generic discount label
              // — admins fill it with coupon copy like "Up to 50% off".
              const dealLabel = s.cashbackRate ?? "View coupons";
              const prev = s.previousCashbackRate;
              return (
                <Link
                  key={s.id}
                  href={`/stores/${s.slug}`}
                  className="group block w-[220px] shrink-0 snap-start"
                  aria-label={`${s.name} — ${dealLabel}`}
                >
                  <div
                    className="flex h-[88px] items-center justify-center overflow-hidden rounded-md p-4 transition group-hover:opacity-95"
                    style={{ backgroundColor: bg }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.logoUrl}
                      alt={s.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-2.5 text-[13px] leading-snug">
                    <span className="font-semibold text-cv-primary underline decoration-1 underline-offset-2 group-hover:no-underline">
                      {dealLabel}
                    </span>
                    {prev && <span className="text-cv-neutral-500"> was {prev}</span>}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
