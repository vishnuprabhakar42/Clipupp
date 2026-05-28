import { CheckCircle2, ChevronDown, Sparkles, TrendingUp, Users2, Flame } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { CouponSummary } from "@/lib/api/types";

/**
 * Platform-wide coupon row card — most-rendered component on the site.
 * Server-rendered, zero client JS. Layout (desktop):
 *
 *   ┌──── savings ────┬───┬──── title + meta ────┬──── CTA + code hint ────┐
 *
 * The reveal under "Show details" is a native <details> so it works without
 * JS. The CTA is an <a target="_blank"> pointing at /r/{couponId} so the
 * affiliate redirect happens server-side via the Spring backend.
 *
 * Visual tier (Phase 2 redesign):
 * - Hot deals: 2px crimson border, gradient stripe "FLASH" + savings text
 *   gets `.cv-text-gradient-savings` (amber gradient).
 * - Recommended: 2px crimson border, gradient stripe "RECOMMENDED".
 * - Default: 1px neutral border, savings in crimson.
 * Codes get an amber-gradient CTA with the last 2 chars peeking behind.
 * Deals get a crimson-gradient CTA, full-width.
 */
export function CouponSavingsRowCard({ coupon }: { coupon: CouponSummary }) {
  const isCode = coupon.type === "CODE";
  const isHot =
    (coupon.usedCount ?? 0) >= 50 || (coupon.popularityScore ?? 0) >= 75;
  const isFlashDeal = isHot && (coupon.type === "DEAL" || coupon.type === "FREE_SHIPPING");
  const isRecommended = coupon.exclusive || (coupon.verified && isHot && !isFlashDeal);
  const showStripe = isRecommended || isFlashDeal;

  const savings = (coupon.savingsLabel ?? "").trim();
  const savingsBig = savings
    ? savings.replace(/\s*(off|back)\s*$/i, "").trim()
    : coupon.title.split(" ").slice(0, 3).join(" ");

  const ctaText = savings
    ? "Get this deal"
    : isCode
      ? "Get coupon code"
      : coupon.type === "FREE_SHIPPING"
        ? "Get free shipping"
        : coupon.type === "IN_STORE"
          ? "Get in-store deal"
          : "Get this deal";

  // Two trailing chars of the code peek behind the CTA. RetailMeNot pattern.
  const codeHint = isCode
    ? coupon.code
      ? coupon.code.slice(-2).toUpperCase()
      : "ER"
    : null;

  const successRate =
    coupon.popularityScore != null && coupon.popularityScore > 0
      ? Math.min(99, Math.max(70, coupon.popularityScore))
      : null;

  // Border + savings color tier.
  const borderCls = isFlashDeal
    ? "border-cv-accent-500 border-2"
    : isRecommended
      ? "border-cv-primary-600 border-2"
      : "border-cv-neutral-200 border";
  // Savings color: always amber gradient for hot deals, otherwise crimson.
  const useGradient = isFlashDeal || isHot;

  return (
    <article
      className={`relative overflow-hidden rounded-xl bg-white shadow-resting transition-shadow hover:shadow-hover ${borderCls}`}
    >
      {showStripe && (
        <div className="bg-cv-primary px-5 py-1.5">
          <span className="inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-white">
            {isFlashDeal ? (
              <>
                <Flame className="h-3 w-3" aria-hidden strokeWidth={2} />
                Flash deal
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" aria-hidden strokeWidth={2} />
                Recommended
              </>
            )}
          </span>
        </div>
      )}

      {/* Mobile: stacked. Desktop: 3-col grid with dashed divider. */}
      <div className="flex flex-col md:flex-row md:items-stretch">
        {/* SAVINGS column */}
        <div className="flex shrink-0 items-center justify-center px-5 py-5 md:w-[180px] md:py-7">
          <p
            className={`cv-savings-massive text-center uppercase ${
              useGradient
                ? "cv-text-gradient-savings"
                : "text-cv-primary-700"
            }`}
          >
            {savingsBig}
          </p>
        </div>

        {/* Vertical dashed divider — desktop only */}
        <div className="hidden self-stretch border-l-2 border-dashed border-cv-neutral-200 md:my-5 md:block" />

        {/* TITLE + details column */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-5 py-4 md:px-6 md:py-6">
          <Link
            href={`/coupons/${coupon.slug}`}
            className="line-clamp-2 font-display text-[15px] font-bold leading-snug text-cv-neutral-900 transition-colors hover:text-cv-primary-700 md:text-[17px]"
          >
            {coupon.title}
          </Link>

          {(coupon.description || coupon.code) && (
            <details className="group/details">
              <summary className="inline-flex w-fit cursor-pointer items-center gap-1 text-[13px] font-semibold text-cv-primary-700 outline-none hover:underline focus-visible:underline">
                Show details
                <ChevronDown
                  className="h-3.5 w-3.5 transition-transform group-open/details:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="mt-2 space-y-2 text-[13px] leading-relaxed text-cv-neutral-600">
                {coupon.description && <p>{coupon.description}</p>}
                {coupon.code && (
                  <p>
                    Code:{" "}
                    <code className="rounded bg-cv-neutral-100 px-1.5 py-0.5 font-mono text-[12px] font-bold tracking-wider text-cv-neutral-900">
                      {coupon.code}
                    </code>
                  </p>
                )}
              </div>
            </details>
          )}

          {/* Inline meta — verified / exclusive / success / uses */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            {coupon.verified && (
              <span className="cv-badge-verified">
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                Verified
              </span>
            )}
            {coupon.exclusive && (
              <span className="cv-badge-exclusive">
                <Sparkles className="h-3 w-3" aria-hidden />
                Exclusive
              </span>
            )}
            {successRate !== null && (
              <span className="cv-pill bg-cv-success-soft text-cv-success-strong">
                <TrendingUp className="h-3 w-3" aria-hidden />
                <span className="font-bold tabular-nums">{successRate}%</span> success
              </span>
            )}
            {coupon.usedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-cv-neutral-500">
                <Users2 className="h-3 w-3" aria-hidden />
                {coupon.usedCount.toLocaleString()} uses
              </span>
            )}
          </div>
        </div>

        {/* CTA column — overlap pattern: code peeking behind the button. */}
        <div className="flex shrink-0 items-center px-5 py-4 md:w-[300px] md:py-6">
          <div className="relative h-12 w-full">
            {codeHint && (
              <div className="absolute inset-0 flex items-center justify-end rounded-md border-2 border-dashed border-cv-accent-400 bg-cv-accent-soft">
                <span
                  className="select-none pr-3 font-mono text-[13px] font-extrabold tracking-[0.22em] text-cv-accent-700"
                  aria-hidden
                >
                  {codeHint}
                </span>
              </div>
            )}
            <a
              href={`/r/${coupon.id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${ctaText} for ${coupon.title}`}
              className={`${isCode ? "cv-btn-accent-gradient" : "cv-btn-primary-gradient"} absolute inset-y-0 left-0 z-10 text-[13px] font-extrabold uppercase tracking-wide ${
                codeHint ? "w-[76%]" : "w-full"
              }`}
            >
              {ctaText}
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
