import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { ScrollRail } from "@/components/site/ScrollRail";
import { storesApi } from "@/lib/api/stores";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

type Store = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  cashbackRate?: string | null;
  previousCashbackRate?: string | null;
};

/**
 * Horizontal rail of store logo tiles. Title + item set come from the
 * homepage layout API (admin-managed). Server-rendered HTML; arrow buttons
 * hydrate as a small client island (ScrollRail). CSS scroll-snap makes the
 * rail usable without JS.
 *
 * Visual tier (Phase 2): each card gets a 4-colour rotating top stripe so
 * the rail reads as energetic but ordered. Logo tile keeps the
 * fixed-aspect / object-contain contract for CLS = 0.
 */
export async function TrendingStoresRail({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const limit = section?.itemLimit ?? 12;
  const heading = section?.title ?? "Your favorites & visited";
  const preloaded = (section?.stores as Store[] | null | undefined) ?? null;

  const stores: Store[] = preloaded ?? (await safeFetch(limit));

  return (
    <section aria-labelledby="trending-stores-heading" className="relative">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h2 id="trending-stores-heading" className="cv-eyebrow-vivid">{heading}</h2>
        </div>
        <Link
          href="/stores"
          className="text-sm font-medium text-cv-primary-700 hover:underline"
        >
          See all →
        </Link>
      </div>

      {stores.length === 0 ? (
        <p className="cv-meta">No stores yet.</p>
      ) : (
        <ScrollRail ariaLabel="Trending stores" className="gap-5">
          {stores.map((s, i) => (
            <RailItem key={s.id} store={s} priority={i < 6} />
          ))}
        </ScrollRail>
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

function RailItem({
  store,
  priority,
}: {
  store: Store;
  priority: boolean;
}) {
  const dealLabel = store.cashbackRate ?? "View coupons";
  const prev = store.previousCashbackRate;
  const initial = (store.name || "?").trim().charAt(0).toUpperCase();
  const hasLogo = Boolean(store.logoUrl);

  return (
    <Link
      href={`/stores/${store.slug}`}
      className="group block w-[220px] shrink-0 snap-start"
      aria-label={`${store.name} — ${dealLabel}`}
    >
      <div className="cv-card relative h-[88px] w-[220px] overflow-hidden">
        <div className="flex h-full items-center justify-center p-4">
          {hasLogo ? (
            <Image
              src={store.logoUrl}
              alt={store.name}
              width={188}
              height={56}
              priority={priority}
              sizes="188px"
              className="max-h-full w-auto max-w-full object-contain"
            />
          ) : (
            <span
              aria-hidden
              className="grid h-14 w-14 place-items-center rounded-full bg-cv-primary-soft text-cv-primary text-xl font-extrabold"
            >
              {initial}
            </span>
          )}
        </div>
      </div>
      <p className="mt-2.5 text-[13px] leading-snug">
        <span className="font-semibold text-cv-primary decoration-1 underline-offset-2 group-hover:underline">
          {dealLabel}
        </span>
        {prev && <span className="text-cv-neutral-500"> was {prev}</span>}
      </p>
    </Link>
  );
}
