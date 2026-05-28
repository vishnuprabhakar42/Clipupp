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
 * Full-width hero band above the two-column store-detail grid. Crimson mesh
 * background, white logo card (shadow-lifted) floating on the gradient, glass
 * meta chips, and an amber-gradient "Visit" CTA with glow. Server-rendered;
 * image priority loaded so it's the LCP candidate on store pages.
 */
export function StoreHero({
  store,
  stats,
  visitUrl,
}: {
  store: HeroStore;
  stats?: StoreStatsInput | null;
  /** Affiliate-routed visit URL — usually `/r/{redirectId}`. Falls back to
   *  primaryUrl, then null if neither is available. */
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
      className="clipupp-section-bg-mesh-primary relative overflow-hidden"
    >
      <div className="clipupp-container py-10 lg:py-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5">
            <div
              className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-3 lg:h-[112px] lg:w-[112px]"
              style={{ boxShadow: "var(--clipupp-shadow-lifted)" }}
            >
              {store.logoUrl ? (
                <Image
                  src={store.logoUrl}
                  alt={store.name}
                  width={96}
                  height={96}
                  sizes="112px"
                  priority
                  className="max-h-full w-auto max-w-full object-contain"
                />
              ) : (
                <span
                  aria-hidden
                  className="grid h-full w-full place-items-center rounded-xl bg-clipupp-primary text-3xl font-bold text-white"
                >
                  {initial}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1
                id="store-hero-heading"
                className="clipupp-display-hero text-white"
              >
                {store.name}
                <span className="block font-display text-[15px] font-bold uppercase tracking-[0.16em] text-white/70 lg:text-[16px]">
                  Coupons & Promo Codes · {monthYear}
                </span>
              </h1>
              {(store.shortDescription || rating !== null) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {rating !== null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-display text-[12px] font-bold text-white backdrop-blur-sm">
                      <Star
                        className="h-3.5 w-3.5 fill-clipupp-accent-400 text-clipupp-accent-400"
                        aria-hidden
                      />
                      <span className="tabular-nums">{rating.toFixed(1)}</span>
                      {store.reviewCount && store.reviewCount > 0 && (
                        <span className="text-white/70">
                          · {store.reviewCount.toLocaleString()}
                        </span>
                      )}
                    </span>
                  )}
                  {store.shortDescription && (
                    <p className="line-clamp-1 max-w-xl text-[14px] font-medium text-white/85">
                      {store.shortDescription}
                    </p>
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
              className="clipupp-btn-accent-gradient self-start text-[14px] font-extrabold uppercase tracking-wide lg:self-center"
            >
              Visit {store.name}
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          )}
        </div>

        {stats && (
          <div className="mt-8">
            <StoreStatChips stats={stats} variant="glass" />
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
