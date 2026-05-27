"use client";

import Image from "next/image";
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
 * Featured stores — clean editorial grid. Equal-sized flat cards in a
 * 2 / 3 / 4-column responsive layout. Logos sit in a white tile with a
 * neutral border so each card scans the same regardless of source brand
 * colour. Single shadow level, no hover lift.
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
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="featured-stores-heading" className="cv-h2">
            {heading}
          </h2>
          {subtitle && (
            <p className="cv-body mt-2 max-w-xl text-cv-neutral-600">{subtitle}</p>
          )}
        </div>
        <Link
          href="/stores"
          className="group inline-flex items-center gap-1 text-sm font-semibold text-cv-primary hover:underline"
        >
          See all stores
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {!preloaded && q.isLoading ? (
        <SkeletonGrid />
      ) : stores.length === 0 ? (
        <p className="cv-meta">No featured stores yet.</p>
      ) : (
        <ul className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
          {stores.map((s, i) => (
            <li key={s.id} className="h-full">
              <StoreCard store={s} index={i} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StoreCard({ store, index }: { store: Store; index: number }) {
  const dealLabel = store.cashbackRate ?? "View coupons";
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-cv-neutral-200 bg-white shadow-card"
      aria-label={store.name}
    >
      {/* Logo tile — flat white, contained image. Aspect ratio reserves
          space so the card never shifts as the image loads. Single padding
          level (p-6) on the wrapper; the image is sized, not `fill`, so
          padding doesn't compound and tiny placeholder text isn't lost. */}
      <div className="flex aspect-[5/3] items-center justify-center overflow-hidden border-b border-cv-neutral-200 bg-white p-6">
        {store.logoUrl ? (
          <Image
            src={store.logoUrl}
            alt={store.name}
            width={220}
            height={120}
            sizes="(min-width: 1280px) 220px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={index < 4}
            className="max-h-full w-auto max-w-full object-contain"
          />
        ) : (
          <span
            aria-hidden
            className="grid h-16 w-16 place-items-center rounded-full bg-cv-primary text-2xl font-semibold text-white"
          >
            {(store.name || "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="line-clamp-1 cv-h3 group-hover:text-cv-primary">
          {store.name}
        </p>
        {store.tagline && (
          <p className="cv-meta line-clamp-1">{store.tagline}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-[13px] font-semibold text-cv-primary">
            {dealLabel}
          </span>
          <ArrowRight
            className="h-4 w-4 text-cv-neutral-300 group-hover:text-cv-primary"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="cv-skeleton h-[240px] rounded-lg" />
      ))}
    </ul>
  );
}
