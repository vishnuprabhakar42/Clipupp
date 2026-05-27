import Image from "next/image";
import { ExternalLink, Star } from "lucide-react";
import { StoreStatChips, type StoreStatsInput } from "./StoreStatChips";

type HeroStore = {
  name: string;
  slug: string;
  logoUrl: string | null;
  shortDescription?: string | null;
  rating?: number | string | null;
  reviewCount?: number | null;
  primaryUrl?: string | null;
};

/**
 * Full-width band above the two-column store-detail grid. Logo (88×88 in a
 * white tile), H1 with brand + month/year, rating row, stat chips below,
 * "Visit brand" CTA on the right. Server-rendered, image priority loaded so
 * it's the LCP candidate on store pages.
 */
export function StoreHero({
  store,
  stats,
  visitUrl,
}: {
  store: HeroStore;
  stats?: StoreStatsInput | null;
  /** Affiliate-routed visit URL — usually `/r/{redirectId}`. Falls back to
   *  primaryUrl, then "#" if neither is available. */
  visitUrl?: string | null;
}) {
  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const cta = visitUrl ?? store.primaryUrl ?? null;
  const initial = (store.name || "?").trim().charAt(0).toUpperCase();
  const rating = parseRating(store.rating);

  return (
    <section
      aria-labelledby="store-hero-heading"
      className="border-b border-cv-neutral-200 bg-white"
    >
      <div className="cv-container py-8 lg:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-cv-neutral-200 bg-white p-2 lg:h-[88px] lg:w-[88px]">
              {store.logoUrl ? (
                <Image
                  src={store.logoUrl}
                  alt={store.name}
                  width={72}
                  height={72}
                  sizes="88px"
                  priority
                  className="max-h-full w-auto max-w-full object-contain"
                />
              ) : (
                <span
                  aria-hidden
                  className="grid h-full w-full place-items-center rounded-md bg-cv-primary text-2xl font-bold text-white"
                >
                  {initial}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1
                id="store-hero-heading"
                className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-cv-neutral-900 lg:text-[2.25rem]"
              >
                {store.name} Coupons & Promo Codes
                <span className="block text-[1rem] font-medium text-cv-neutral-500 lg:text-[1.125rem]">
                  {monthYear}
                </span>
              </h1>
              {(store.shortDescription || rating) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-cv-neutral-600">
                  {rating !== null && (
                    <span className="inline-flex items-center gap-1">
                      <Star
                        className="h-4 w-4 fill-cv-primary text-cv-primary"
                        aria-hidden
                      />
                      <span className="font-semibold tabular-nums text-cv-neutral-900">
                        {rating.toFixed(1)}
                      </span>
                      {store.reviewCount && store.reviewCount > 0 && (
                        <span className="text-cv-neutral-500">
                          · {store.reviewCount.toLocaleString()} reviews
                        </span>
                      )}
                    </span>
                  )}
                  {store.shortDescription && (
                    <span className="line-clamp-1">{store.shortDescription}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {cta && (
            <a
              href={cta}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-cv-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cv-primary-strong lg:self-center"
            >
              Visit {store.name}
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          )}
        </div>

        {stats && (
          <div className="mt-6">
            <StoreStatChips stats={stats} />
          </div>
        )}
      </div>
    </section>
  );
}

function parseRating(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
