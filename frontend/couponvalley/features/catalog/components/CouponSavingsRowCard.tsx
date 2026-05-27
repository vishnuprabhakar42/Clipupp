import { CheckCircle2, ChevronDown, Sparkles, TrendingUp, Users2 } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { CouponSummary } from "@/lib/api/types";

/**
 * The new platform-wide coupon row card. Server-rendered, zero client JS.
 * Layout (desktop):
 *
 *   ┌──────────┬───┬────────────────────────┬─────────────────────────────┐
 *   │ SAVINGS  │ │ │ Title                  │ stats line                  │
 *   │ (huge)   │ │ │ ▾ Show details         │ ┌─[GET CODE]─[XX...ER]──┐  │
 *   └──────────┴───┴────────────────────────┴─────────────────────────────┘
 *
 * The reveal under "Show details" is a native <details> so it works without
 * JS. The CTA is an <a target="_blank"> pointing at /r/{couponId} so the
 * affiliate redirect happens server-side via the Spring backend.
 *
 * Used by store-detail pages and list pages that need a high-density list
 * presentation (couponers expect lists, not tile grids).
 */
export function CouponSavingsRowCard({ coupon }: { coupon: CouponSummary }) {
  const isCode = coupon.type === "CODE";
  const isHot =
    (coupon.usedCount ?? 0) >= 50 || (coupon.popularityScore ?? 0) >= 75;
  const isFlashDeal = isHot && (coupon.type === "DEAL" || coupon.type === "FREE_SHIPPING");
  const isRecommended = coupon.exclusive || (coupon.verified && isHot && !isFlashDeal);

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

  // Border + accent role. Orange ONLY for flash deals (urgency); blue for
  // recommended; neutral otherwise. See feedback_visual_direction memory.
  const borderCls = isFlashDeal
    ? "border-cv-accent"
    : isRecommended
      ? "border-cv-primary"
      : "border-cv-neutral-200";
  const stripBg = isFlashDeal ? "bg-cv-accent" : "bg-cv-primary";
  const savingsColor = isFlashDeal ? "text-cv-accent-strong" : "text-cv-primary";
  const stripLabel = isFlashDeal ? "Flash deal" : "Recommended";

  return (
    <article
      className={`overflow-hidden rounded-lg border-2 bg-white shadow-card ${borderCls}`}
    >
      {(isRecommended || isFlashDeal) && (
        <div className={`${stripBg} px-5 py-1.5`}>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white">
            {stripLabel}
          </span>
        </div>
      )}

      {/* Mobile: stacked rows. Desktop: 3-col grid with dashed divider. */}
      <div className="flex flex-col md:flex-row md:items-stretch">
        {/* SAVINGS column */}
        <div className="flex shrink-0 items-center justify-center px-5 py-5 md:w-[160px] md:py-7">
          <p
            className={`text-center font-display text-[1.75rem] font-extrabold uppercase leading-[1.05] tracking-tight tabular-nums md:text-[2.1rem] md:leading-[1.2] ${savingsColor}`}
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
            className="line-clamp-2 text-[15px] font-semibold leading-snug text-cv-neutral-900 transition-colors hover:text-cv-primary md:text-[17px]"
          >
            {coupon.title}
          </Link>

          {(coupon.description || coupon.code) && (
            <details className="group/details">
              <summary className="inline-flex w-fit cursor-pointer items-center gap-1 text-[13px] font-medium text-cv-primary outline-none hover:underline focus-visible:underline">
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

          {/* Inline meta — verified / hot / exclusive — kept tight */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            {coupon.verified && (
              <span className="inline-flex items-center gap-1 font-medium text-cv-success-strong">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Verified
              </span>
            )}
            {coupon.exclusive && (
              <span className="inline-flex items-center gap-1 font-medium text-cv-accent-strong">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Exclusive
              </span>
            )}
            {successRate !== null && (
              <span className="inline-flex items-center gap-1 font-medium text-cv-success-strong">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                <span className="font-bold">{successRate}%</span> success
              </span>
            )}
            {coupon.usedCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-cv-neutral-500">
                <Users2 className="h-3.5 w-3.5" aria-hidden />
                {coupon.usedCount.toLocaleString()} uses
              </span>
            )}
          </div>
        </div>

        {/* CTA column — overlap pattern: code peeking behind the button. */}
        <div className="flex shrink-0 items-center px-5 py-4 md:w-[300px] md:py-6">
          <div className="relative h-12 w-full">
            {codeHint && (
              <div className="absolute inset-0 flex items-center justify-end rounded-md border-2 border-dashed border-cv-neutral-300 bg-white">
                <span
                  className="select-none pr-3 font-mono text-[12px] font-bold tracking-[0.22em] text-cv-neutral-400"
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
              className={`absolute inset-y-0 left-0 z-10 inline-flex items-center justify-center rounded-md bg-cv-primary px-4 text-[13px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-cv-primary-strong ${
                codeHint ? "w-[78%]" : "w-full"
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
