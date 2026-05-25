"use client";

import { Link } from "@/lib/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { storesApi } from "@/lib/api/stores";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

type Store = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  brandColor?: string | null;
  cashbackRate?: string | null;
  tagline?: string | null;
  rating?: string | null;
  reviewCount?: number;
};

/**
 * Featured stores — clean editorial grid.
 *
 * Equal-sized cards in a 2 / 3 / 4-column responsive layout. Each card is:
 *   • Top: brand-colored panel with centered logo
 *   • Bottom: white panel with store name + deal chip
 *
 * Deliberately restrained: no parallax, no pulsing, no grain, no sheen
 * sweeps. Just soft shadows, a subtle lift on hover, and clean typography.
 * Reads premium because of spacing + hierarchy, not because of effects.
 *
 * Data is preloaded server-side from /api/v1/homepage so first paint has
 * no client fetch.
 */
export function FeaturedStoresGrid({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Featured Stores";
  const subtitle =
    section?.subtitle ?? "Hand-picked stores with the best coupons this week";
  const limit = section?.itemLimit ?? 8;
  const preloaded = section?.stores as Store[] | null | undefined;

  const q = useQuery({
    queryKey: ["home", "featured-stores", limit],
    queryFn: () => storesApi.list({ limit }),
    staleTime: 5 * 60_000,
    enabled: !preloaded,
  });

  const stores = (preloaded ?? (q.data?.data as Store[] | undefined) ?? []).slice(0, limit);

  return (
    <section aria-labelledby="featured-stores-heading">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="featured-stores-heading"
            className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
          >
            {heading}
          </h2>
          {subtitle && (
            <p className="mt-1 max-w-xl text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        <Link
          href="/stores"
          className="group inline-flex items-center gap-1 text-sm font-semibold text-cv-primary hover:underline"
        >
          See all stores
          <ArrowRight
            className="h-4 w-4 transition group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>

      {!preloaded && q.isLoading ? (
        <SkeletonGrid />
      ) : stores.length === 0 ? (
        <p className="text-sm text-cv-neutral-500">No featured stores yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {stores.map((s, i) => (
            <li key={s.id}>
              <StoreCard store={s} index={i} />
            </li>
          ))}
        </ul>
      )}

      <style>{`
        @keyframes cv-rise {
          0%   { opacity: 0; transform: translate3d(0, 8px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .cv-rise { animation: cv-rise 360ms cubic-bezier(.21,.94,.31,1.01) both; }
      `}</style>
    </section>
  );
}

/* ────────────────────────────  Store card  ──────────────────────────────── */

function StoreCard({ store, index }: { store: Store; index: number }) {
  const bg = store.brandColor || "#1f2937";
  // Generic discount label — admin fills with coupon copy like "Up to 50% off".
  const dealLabel = store.cashbackRate ?? "View coupons";
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="cv-rise group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),0_24px_48px_-12px_rgba(0,0,0,0.14)]"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-label={store.name}
    >
      {/* Brand panel — full-bleed colour, logo centered with uniform padding
          so square / landscape / portrait logos all read at the same size. */}
      <div
        className="relative flex aspect-[5/3] items-center justify-center overflow-hidden p-6"
        style={{ backgroundColor: bg }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.logoUrl}
          alt={store.name}
          className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          loading={index < 4 ? "eager" : "lazy"}
          decoding="async"
        />
      </div>

      {/* Info panel — white */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="line-clamp-1 text-[15px] font-bold tracking-tight text-gray-900 group-hover:text-cv-primary">
          {store.name}
        </p>
        {store.tagline && (
          <p className="line-clamp-1 text-[12px] leading-snug text-cv-neutral-500">
            {store.tagline}
          </p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[13px] font-bold text-cv-primary">
            {dealLabel}
          </span>
          <ArrowRight
            className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-cv-primary"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}

/* ──────────────────────────────  Skeleton  ──────────────────────────────── */

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="h-[240px] animate-pulse rounded-xl bg-gray-100" />
      ))}
    </ul>
  );
}
