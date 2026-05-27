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
 * Logo tile contract:
 *   • Fixed-aspect parent (88px x 220px) with `relative`, `overflow-hidden`,
 *     1px neutral border, white background, 12px radius — single shadow level.
 *   • Inside, EITHER a sized `<Image>` (object-contain, h-full w-full) OR a
 *     centered fallback that shows the store initial in the brand colour.
 *   • Outer padding `p-4` is the ONLY padding — no compounding `p-N` on the
 *     image itself.
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

function RailItem({ store, priority }: { store: Store; priority: boolean }) {
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
      <div className="flex h-[88px] w-[220px] items-center justify-center overflow-hidden rounded-lg border border-cv-neutral-200 bg-white p-4">
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
}
