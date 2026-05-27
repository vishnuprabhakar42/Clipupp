"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { storesApi } from "@/lib/api/stores";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Horizontal rail of store logo tiles. Title + item set come from the
 * homepage layout API (admin-managed). Native scroll-snap; arrow buttons
 * appear only when the rail can scroll in that direction.
 *
 * Logo tile contract:
 *   • Fixed-aspect parent (88px × 220px) with `relative`, `overflow-hidden`,
 *     1px neutral border, white background, 12px radius — single shadow level.
 *   • Inside, EITHER a sized `<Image>` (object-contain, h-full w-full) OR a
 *     centered fallback that shows the store initial in the brand colour.
 *   • Outer padding `p-4` is the ONLY padding — no compounding `p-N` on the
 *     image itself, which was previously shrinking logos to ~20px visible.
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
        <h2 id="trending-stores-heading" className="cv-h2">
          {heading}
        </h2>
        <Link
          href="/stores"
          className="text-sm font-semibold text-cv-primary hover:underline"
        >
          See all →
        </Link>
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll("left")}
          disabled={!canLeft}
          className="absolute -left-3 top-[44px] z-dropdown hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-cv-neutral-200 bg-white text-cv-neutral-600 shadow-card transition-colors hover:text-cv-neutral-900 disabled:cursor-not-allowed disabled:opacity-0 md:grid"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll("right")}
          disabled={!canRight}
          className="absolute -right-3 top-[44px] z-dropdown hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-cv-neutral-200 bg-white text-cv-neutral-600 shadow-card transition-colors hover:text-cv-neutral-900 disabled:cursor-not-allowed disabled:opacity-0 md:grid"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {!preloaded && q.isLoading ? (
          <div className="flex gap-5 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0">
                <div className="cv-skeleton h-[88px] w-[220px] rounded-lg" />
                <div className="cv-skeleton mt-3 h-4 w-32 rounded" />
              </div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <p className="cv-meta">No stores yet.</p>
        ) : (
          <div
            ref={railRef}
            className="cv-no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
          >
            {stores.map((s, i) => {
              const dealLabel = s.cashbackRate ?? "View coupons";
              const prev = s.previousCashbackRate;
              const initial = (s.name || "?").trim().charAt(0).toUpperCase();
              const hasLogo = Boolean(s.logoUrl);
              return (
                <Link
                  key={s.id}
                  href={`/stores/${s.slug}`}
                  className="group block w-[220px] shrink-0 snap-start"
                  aria-label={`${s.name} — ${dealLabel}`}
                >
                  <div className="flex h-[88px] w-[220px] items-center justify-center overflow-hidden rounded-lg border border-cv-neutral-200 bg-white p-4">
                    {hasLogo ? (
                      <Image
                        src={s.logoUrl}
                        alt={s.name}
                        width={188}
                        height={56}
                        priority={i < 6}
                        sizes="188px"
                        className="max-h-full w-auto max-w-full object-contain"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="grid h-14 w-14 place-items-center rounded-full bg-cv-primary text-xl font-semibold text-white"
                      >
                        {initial}
                      </span>
                    )}
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
