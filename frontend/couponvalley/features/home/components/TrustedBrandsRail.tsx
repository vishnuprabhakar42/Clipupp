"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { storesApi } from "@/lib/api/stores";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

type Store = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  brandColor?: string | null;
};

/**
 * "Explore online promo codes from brands you trust" — a clean white-card
 * logo carousel. Native scroll + scroll-snap (no JS-driven animation), with
 * arrow buttons that scroll a viewport-width at a time and pagination dots
 * that reflect the current page.
 *
 * Data preloaded from /api/v1/homepage when wired through the layout API.
 * Falls back to a client fetch only for legacy callers.
 */
export function TrustedBrandsRail({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Explore online promo codes from brands you trust";
  const limit = section?.itemLimit ?? 12;
  const preloaded = section?.stores as Store[] | null | undefined;

  const q = useQuery({
    queryKey: ["home", "trusted-brands", limit],
    queryFn: () => storesApi.list({ limit }),
    staleTime: 5 * 60_000,
    enabled: !preloaded,
  });

  const stores = (preloaded ?? (q.data?.data as Store[] | undefined) ?? []).slice(0, limit);

  const railRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Keep page count + arrow visibility in sync with scroll position.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () => {
      const total = el.scrollWidth;
      const viewport = el.clientWidth;
      const max = total - viewport;
      const p = viewport > 0 ? Math.max(1, Math.ceil(total / viewport)) : 1;
      const current = viewport > 0 ? Math.round(el.scrollLeft / viewport) : 0;
      setPages(p);
      setPage(Math.min(current, p - 1));
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

  function scrollByPage(dir: "left" | "right") {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? el.clientWidth : -el.clientWidth, behavior: "smooth" });
  }

  function goTo(p: number) {
    const el = railRef.current;
    if (!el) return;
    el.scrollTo({ left: p * el.clientWidth, behavior: "smooth" });
  }

  return (
    <section aria-labelledby="trusted-brands-heading">
      <h2
        id="trusted-brands-heading"
        className="font-serif text-3xl font-bold leading-tight tracking-tight text-cv-neutral-800 sm:text-4xl"
      >
        {heading}
      </h2>

      <div className="relative mt-6">
        {/* Left arrow — outline style, mirrors the reference exactly */}
        <button
          type="button"
          aria-label="Previous brands"
          onClick={() => scrollByPage("left")}
          disabled={!canLeft}
          className="absolute left-0 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-gray-200 bg-white text-cv-neutral-400 shadow-sm transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-0 md:grid"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>

        {/* The rail */}
        <div
          ref={railRef}
          className="cv-no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollPaddingInline: "0.5rem" }}
        >
          {q.isLoading && !preloaded
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[110px] w-[calc((100%-3rem)/2)] shrink-0 animate-pulse snap-start rounded-md bg-gray-100 sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/6)]"
                />
              ))
            : stores.map((s) => <BrandCard key={s.id} store={s} />)}
        </div>

        {/* Right arrow — dark filled, matches the reference */}
        <button
          type="button"
          aria-label="Next brands"
          onClick={() => scrollByPage("right")}
          disabled={!canRight}
          className="absolute right-0 top-1/2 z-10 hidden h-12 w-12 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cv-neutral-800 text-white shadow-md transition hover:bg-cv-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 md:grid"
        >
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Pagination dots */}
      {pages > 1 && (
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
                  ? "w-6 bg-cv-neutral-800"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────  Brand card  ─────────────────────────────── */

function BrandCard({ store }: { store: Store }) {
  return (
    <Link
      href={`/stores/${store.slug}`}
      // overflow-hidden + capped max-w/max-h on the <img> below keep every
      // brand tile a uniform size regardless of source image dimensions.
      className="group relative flex h-[110px] w-[calc((100%-3rem)/2)] shrink-0 snap-start items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white px-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/6)]"
      aria-label={store.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={store.logoUrl}
        alt={store.name}
        className="max-h-[55%] max-w-[70%] object-contain transition-transform duration-500 ease-out group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
    </Link>
  );
}
