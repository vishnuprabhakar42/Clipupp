"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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
 * "Explore online promo codes from brands you trust" — flat white logo tiles
 * in a horizontally scrolling rail. Native scroll + scroll-snap; arrow
 * buttons + pagination dots reflect scroll position.
 *
 * Image render contract (same as TrendingStoresRail for visual consistency):
 *   • Fixed-aspect parent (110px tall × responsive width) with `relative`,
 *     `overflow-hidden`, 1px border, white background, 12px radius.
 *   • Single padding level — `p-4` on the parent, no compounding padding on
 *     the image itself.
 *   • Sized <Image> (not `fill`) with object-contain so logos render at a
 *     readable size regardless of source aspect ratio.
 *   • Missing-logo fallback: store initial in a primary-coloured circle.
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
      <h2 id="trusted-brands-heading" className="cv-h2">
        {heading}
      </h2>

      <div className="relative mt-6">
        <button
          type="button"
          aria-label="Previous brands"
          onClick={() => scrollByPage("left")}
          disabled={!canLeft}
          className="absolute left-0 top-1/2 z-dropdown hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cv-neutral-200 bg-white text-cv-neutral-600 shadow-card transition-colors hover:text-cv-neutral-900 disabled:cursor-not-allowed disabled:opacity-0 md:grid"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>

        <div
          ref={railRef}
          className="cv-no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollPaddingInline: "0.5rem" }}
        >
          {q.isLoading && !preloaded
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="cv-skeleton h-[110px] w-[calc((100%-3rem)/2)] shrink-0 snap-start rounded-lg sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/6)]"
                />
              ))
            : stores.map((s) => <BrandCard key={s.id} store={s} />)}
        </div>

        <button
          type="button"
          aria-label="Next brands"
          onClick={() => scrollByPage("right")}
          disabled={!canRight}
          className="absolute right-0 top-1/2 z-dropdown hidden h-11 w-11 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cv-neutral-200 bg-white text-cv-neutral-600 shadow-card transition-colors hover:text-cv-neutral-900 disabled:cursor-not-allowed disabled:opacity-0 md:grid"
        >
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

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
                  ? "w-6 bg-cv-primary"
                  : "w-2 bg-cv-neutral-300 hover:bg-cv-neutral-400"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BrandCard({ store }: { store: Store }) {
  const initial = (store.name || "?").trim().charAt(0).toUpperCase();
  const hasLogo = Boolean(store.logoUrl);
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="flex h-[110px] w-[calc((100%-3rem)/2)] shrink-0 snap-start items-center justify-center overflow-hidden rounded-lg border border-cv-neutral-200 bg-white p-4 sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/6)]"
      aria-label={store.name}
    >
      {hasLogo ? (
        <Image
          src={store.logoUrl}
          alt={store.name}
          width={188}
          height={72}
          sizes="(min-width: 1024px) 188px, (min-width: 640px) 33vw, 50vw"
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
    </Link>
  );
}
