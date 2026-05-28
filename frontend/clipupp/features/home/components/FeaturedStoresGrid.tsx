import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { storesApi } from "@/lib/api/stores";
import { CashbackChip } from "@/features/cashback/components/CashbackChip";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

type Store = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  brandColor?: string | null;
  cashbackRate?: string | null;
  cashbackRateBps?: number | null;
  cashbackEnabled?: boolean | null;
  tagline?: string | null;
  rating?: string | null;
  reviewCount?: number;
};

/**
 * Featured stores — vivid grid. Equal-sized clipupp-card-vivid cards in a
 * 2 / 3 / 4-column responsive layout. Crimson→amber gradient border lifts
 * each card off the page. Logos sit in a fixed-aspect white tile; the body
 * shows tagline + cashback chip (when enabled) + a "View coupons" arrow.
 *
 * Server-rendered. Prefers `section.stores` from the homepage payload; falls
 * back to `storesApi.list({ limit })` when the admin hasn't pinned items.
 */
export async function FeaturedStoresGrid({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Featured Stores";
  const subtitle =
    section?.subtitle ?? "Hand-picked stores with the best coupons this week";
  const limit = section?.itemLimit ?? 8;
  const preloaded = (section?.stores as Store[] | null | undefined) ?? null;

  const stores: Store[] = (preloaded ?? (await safeFetch(limit))).slice(0, limit);

  return (
    <section aria-labelledby="featured-stores-heading">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="featured-stores-heading" className="clipupp-eyebrow-vivid">{heading}</h2>
          {subtitle && (
            <p className="clipupp-body mt-2 max-w-xl text-clipupp-neutral-700">
              {subtitle}
            </p>
          )}
        </div>
        <Link
          href="/stores"
          className="group inline-flex items-center gap-1 text-sm font-medium text-clipupp-primary-700 hover:underline"
        >
          See all stores
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>

      {stores.length === 0 ? (
        <p className="clipupp-meta">No featured stores yet.</p>
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

async function safeFetch(limit: number): Promise<Store[]> {
  try {
    const page = await storesApi.list({ limit });
    return (page.data ?? []) as Store[];
  } catch {
    return [];
  }
}

function StoreCard({ store, index }: { store: Store; index: number }) {
  const dealLabel = store.cashbackRate ?? "View coupons";
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="clipupp-card-vivid group flex h-full flex-col overflow-hidden bg-white"
      aria-label={store.name}
    >
      <div className="flex aspect-[5/3] items-center justify-center overflow-hidden bg-white p-6">
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
            className="grid h-16 w-16 place-items-center rounded-full bg-clipupp-primary-soft text-clipupp-primary text-2xl font-extrabold"
          >
            {(store.name || "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
        <p className="line-clamp-1 clipupp-h3 group-hover:text-clipupp-primary-700">
          {store.name}
        </p>
        {store.tagline && (
          <p className="clipupp-meta line-clamp-1">{store.tagline}</p>
        )}
        <CashbackChip
          rateBps={store.cashbackRateBps}
          enabled={store.cashbackEnabled}
        />
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-[13px] font-bold text-clipupp-primary-700">
            {dealLabel}
          </span>
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-clipupp-primary-soft text-clipupp-primary-700 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
