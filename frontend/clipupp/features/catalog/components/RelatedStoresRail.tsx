import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { ScrollRail } from "@/components/site/ScrollRail";

type RailStore = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  cashbackRate?: string | null;
};

/**
 * Horizontal rail of related stores. Server-renders the cards as a flex
 * row; arrow controls hydrate via the shared ScrollRail client island.
 * Used at the bottom of store-detail pages to keep visitors browsing
 * (better crawler weight than the old sidebar text list).
 */
export function RelatedStoresRail({
  stores,
  heading = "You might also like",
  subheading,
}: {
  stores: RailStore[];
  heading?: string;
  subheading?: string;
}) {
  if (!stores || stores.length === 0) return null;
  return (
    <section aria-labelledby="related-stores-heading" className="clipupp-section">
      <div className="mb-6">
        <h2 id="related-stores-heading" className="clipupp-h2">
          {heading}
        </h2>
        {subheading && (
          <p className="clipupp-body mt-2 max-w-xl text-clipupp-neutral-600">{subheading}</p>
        )}
      </div>
      <ScrollRail ariaLabel="Related stores" className="gap-4">
        {stores.map((s) => (
          <RelatedStoreCard key={s.id} store={s} />
        ))}
      </ScrollRail>
    </section>
  );
}

function RelatedStoreCard({ store }: { store: RailStore }) {
  const initial = (store.name || "?").trim().charAt(0).toUpperCase();
  const dealLabel = store.cashbackRate ?? "View coupons";
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="group flex w-[220px] shrink-0 snap-start flex-col gap-3 rounded-lg border border-clipupp-neutral-200 bg-white p-4 shadow-card transition-colors hover:border-clipupp-primary"
      aria-label={`${store.name} — ${dealLabel}`}
    >
      <div className="flex h-[72px] items-center justify-center overflow-hidden rounded-md bg-white">
        {store.logoUrl ? (
          <Image
            src={store.logoUrl}
            alt={store.name}
            width={160}
            height={56}
            sizes="220px"
            className="max-h-full w-auto max-w-full object-contain"
          />
        ) : (
          <span
            aria-hidden
            className="grid h-12 w-12 place-items-center rounded-full bg-clipupp-primary text-lg font-semibold text-white"
          >
            {initial}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="clipupp-h3 line-clamp-1 text-[15px]">{store.name}</p>
        <p className="clipupp-meta mt-0.5 line-clamp-1 font-semibold text-clipupp-primary">
          {dealLabel}
        </p>
      </div>
    </Link>
  );
}
