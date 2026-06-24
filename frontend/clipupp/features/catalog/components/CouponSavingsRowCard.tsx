import { ChevronDown, Sparkles, TrendingUp, Users2, Flame, BadgeCheck, Clock } from "lucide-react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { CouponSummary } from "@/lib/api/types";

/**
 * Platform-wide coupon row card — the most-rendered, most-clicked component on
 * the site (store pages, /coupons, /offers, /search, category pages).
 * Server-rendered, zero client JS. Desktop layout:
 *
 *   ┌── savings stub ┊ logo·title·meta ──┊── slide-reveal CTA ──┐
 *
 * Mobile: the savings stub stays beside the title block; the CTA drops to a
 * full-width row below (CouponFollow pattern).
 *
 * - Left "stub": a LIGHT color-coded emphasis tab (Flash > Recommended >
 *   Exclusive > Verified) above the big stacked savings number. Tinted bg +
 *   dashed divider read as a torn coupon stub.
 * - The reveal under "See Details" is a native <details> (works without JS).
 * - CTA is an <a target="_blank"> → /r/{couponId} (server-side affiliate
 *   redirect). For codes a solid "cover" button sits over a dashed code box
 *   and narrows on hover to reveal more of the code (+ a sheen sweep); deals
 *   get a full-width button. See .clipupp-coupon-cta / .clipupp-coupon-cover.
 *
 * Store identity (logo + name) comes from the coupon when present, else from
 * the fallback props — store-page coupons don't embed it, so the page passes
 * the store's name/logo down.
 */

/** Split a savings label like "Up to 20% Off" into stacked caption + number. */
function parseSavings(label: string, fallbackTitle: string) {
  const trimmed = label.trim();
  if (!trimmed) {
    return {
      top: null as string | null,
      big: fallbackTitle.split(" ").slice(0, 3).join(" "),
      bottom: null as string | null,
    };
  }
  const top = /^up to/i.test(trimmed) ? "Up to" : null;
  const numMatch = trimmed.match(/\$?\d[\d.,]*%?/);
  const big = numMatch ? numMatch[0] : trimmed.replace(/^up to\s*/i, "").trim();
  const bottomMatch = trimmed.match(/\b(off|sale|deal|saved?)\b\s*$/i);
  const bottom = bottomMatch ? bottomMatch[1] : null;
  return { top, big, bottom };
}

const TYPE_LABEL: Record<string, string> = {
  CODE: "Code",
  DEAL: "Deal",
  FREE_SHIPPING: "Free shipping",
  IN_STORE: "In-store",
};

type Emphasis = { label: string; icon: typeof Flame; cls: string };

export function CouponSavingsRowCard({
  coupon,
  fallbackStoreName,
  fallbackStoreLogoUrl,
}: {
  coupon: CouponSummary;
  fallbackStoreName?: string | null;
  fallbackStoreLogoUrl?: string | null;
}) {
  const isCode = coupon.type === "CODE";
  const isHot =
    (coupon.usedCount ?? 0) >= 50 || (coupon.popularityScore ?? 0) >= 75;
  const isFlashDeal = isHot && (coupon.type === "DEAL" || coupon.type === "FREE_SHIPPING");
  const isRecommended = coupon.exclusive || (coupon.verified && isHot && !isFlashDeal);

  const savings = (coupon.savingsLabel ?? "").trim();
  const { top: savingsTop, big: savingsBig, bottom: savingsBottom } = parseSavings(
    savings,
    coupon.title,
  );

  const ctaText = isCode
    ? "Get coupon code"
    : coupon.type === "FREE_SHIPPING"
      ? "Get free shipping"
      : coupon.type === "IN_STORE"
        ? "Get in-store deal"
        : "Get this deal";

  // Code peeking behind the cover button. RetailMeNot / CouponFollow pattern.
  const codeText = isCode ? (coupon.code?.toUpperCase() ?? "CODE") : null;

  const successRate =
    coupon.popularityScore != null && coupon.popularityScore > 0
      ? Math.min(99, Math.max(70, coupon.popularityScore))
      : null;

  // "Expires soon!" when within ~3 days. Coarse threshold — fine for SSR.
  const expiresSoon = (() => {
    if (!coupon.expiresAt) return false;
    const ms = new Date(coupon.expiresAt).getTime() - Date.now();
    return ms > 0 && ms <= 3 * 24 * 60 * 60 * 1000;
  })();

  // LIGHT color-coded emphasis tab — priority Flash > Recommended > Exclusive
  // > Verified. Soft backgrounds so it reads as a quiet label above the number.
  const emphasis: Emphasis | null = isFlashDeal
    ? {
        label: "Flash deal",
        icon: Flame,
        cls: "bg-clipupp-accent-soft text-clipupp-accent-strong",
      }
    : isRecommended
      ? {
          label: "Recommended",
          icon: Sparkles,
          cls: "bg-clipupp-primary-soft text-clipupp-primary-strong",
        }
      : coupon.exclusive
        ? {
            label: "Exclusive",
            icon: Sparkles,
            cls: "bg-clipupp-accent-soft text-clipupp-accent-strong",
          }
        : coupon.verified
          ? {
              label: "Verified",
              icon: BadgeCheck,
              cls: "bg-clipupp-success-soft text-clipupp-success-strong",
            }
          : null;

  const typeLabel = TYPE_LABEL[coupon.type] ?? null;
  const storeName = coupon.storeName ?? fallbackStoreName ?? null;
  const storeLogoUrl = coupon.storeLogoUrl ?? fallbackStoreLogoUrl ?? null;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-clipupp-neutral-200 bg-white shadow-resting transition-all duration-200 hover:-translate-y-0.5 hover:border-clipupp-neutral-300 hover:shadow-hover">
      <div className="flex flex-col md:flex-row md:items-stretch">
        {/* SAVINGS stub + TITLE block — always side-by-side (incl. mobile). */}
        <div className="flex flex-1 items-stretch">
          {/* SAVINGS stub */}
          <div className="relative flex w-[92px] shrink-0 flex-col items-center justify-center gap-0.5 bg-clipupp-neutral-50/70 px-2 pb-4 pt-7 md:w-[190px] md:px-5 md:py-9">
            {emphasis && (
              <span
                className={`absolute left-1/2 top-0 inline-flex max-w-[90%] -translate-x-1/2 items-center gap-1 truncate rounded-b-lg px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.08em] md:px-3 md:py-1 md:text-[11px] md:tracking-[0.1em] ${emphasis.cls}`}
              >
                <emphasis.icon className="h-2.5 w-2.5 md:h-3 md:w-3" aria-hidden strokeWidth={2.5} />
                {emphasis.label}
              </span>
            )}

            {savingsTop && (
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-clipupp-neutral-500 md:text-[13px] md:tracking-[0.14em]">
                {savingsTop}
              </span>
            )}
            <span className="clipupp-savings-massive text-center uppercase text-clipupp-primary-700">
              {savingsBig}
            </span>
            {savingsBottom && (
              <span className="font-display text-[12px] font-extrabold uppercase tracking-[0.14em] text-clipupp-neutral-600 md:text-[15px] md:tracking-[0.16em]">
                {savingsBottom}
              </span>
            )}
          </div>

          {/* Vertical dashed divider */}
          <div className="my-4 self-stretch border-l-2 border-dashed border-clipupp-neutral-200 md:my-6" />

          {/* TITLE + details column */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-4 py-4 md:px-7 md:py-6">
            {/* Merchant logo + name */}
            {storeLogoUrl && (
              <span className="inline-flex items-center gap-1.5">
                <Image
                  src={storeLogoUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-[4px] object-contain"
                  aria-hidden
                />
                {storeName && (
                  <span className="text-[12px] font-semibold text-clipupp-neutral-700 md:text-[13px]">
                    {storeName}
                  </span>
                )}
              </span>
            )}

            <Link
              href={`/coupons/${coupon.slug}`}
              className="line-clamp-2 font-display text-[17px] font-bold leading-snug text-clipupp-neutral-900 transition-colors hover:text-clipupp-primary-700 md:text-[21px]"
            >
              {coupon.title}
            </Link>

            {/* Sub-line: TYPE • Verified / Expires soon */}
            {typeLabel && (
              <span className="inline-flex flex-wrap items-center gap-1 text-[12px] font-medium text-clipupp-neutral-500">
                <span className="font-semibold uppercase tracking-[0.08em]">{typeLabel}</span>
                {coupon.verified && (
                  <span className="inline-flex items-center gap-1 text-clipupp-success-strong">
                    <span aria-hidden>•</span>
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    Verified
                  </span>
                )}
                {!coupon.verified && expiresSoon && (
                  <span className="inline-flex items-center gap-1 text-clipupp-accent-strong">
                    <span aria-hidden>•</span>
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    Expires soon!
                  </span>
                )}
              </span>
            )}

            {(coupon.description || coupon.code) && (
              <details className="group/details">
                <summary className="inline-flex w-fit cursor-pointer items-center gap-1 text-[13px] font-semibold text-clipupp-primary-700 outline-none hover:underline focus-visible:underline">
                  See Details
                  <ChevronDown
                    className="h-3.5 w-3.5 transition-transform group-open/details:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="mt-2 space-y-2 text-[13px] leading-relaxed text-clipupp-neutral-600">
                  {coupon.description && <p>{coupon.description}</p>}
                  {coupon.code && (
                    <p>
                      Code:{" "}
                      <code className="rounded bg-clipupp-neutral-100 px-1.5 py-0.5 font-mono text-[12px] font-bold tracking-wider text-clipupp-neutral-900">
                        {coupon.code}
                      </code>
                    </p>
                  )}
                </div>
              </details>
            )}

            {/* Inline meta — success / uses */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              {successRate !== null && (
                <span className="clipupp-pill bg-clipupp-success-soft text-clipupp-success-strong">
                  <TrendingUp className="h-3 w-3" aria-hidden />
                  <span className="font-bold tabular-nums">{successRate}%</span> success
                </span>
              )}
              {coupon.usedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-clipupp-neutral-500">
                  <Users2 className="h-3 w-3" aria-hidden />
                  {coupon.usedCount.toLocaleString()} uses
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CTA — full-width row on mobile, fixed column on desktop. */}
        <div className="flex shrink-0 items-center border-t border-clipupp-neutral-100 px-4 py-4 md:w-[280px] md:border-t-0 md:py-6 md:pr-7">
          {codeText ? (
            <div className="group/cta relative h-12 w-full">
              {/* Dashed code box behind the cover — tail peeks, more on hover. */}
              <span
                className="clipupp-coupon-code absolute inset-y-0 right-0 w-[46%] justify-end overflow-hidden pr-2.5 text-[13px]"
                aria-hidden
              >
                {codeText}
              </span>
              {/* Sliding cover button — narrows on group hover. */}
              <a
                href={`/r/${coupon.id}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${ctaText} for ${coupon.title}`}
                className="clipupp-coupon-cta clipupp-coupon-cover absolute inset-y-0 left-0 z-10 w-[80%] whitespace-nowrap px-2 text-[13px] uppercase tracking-wide group-hover/cta:w-[66%]"
              >
                {ctaText}
              </a>
            </div>
          ) : (
            <a
              href={`/r/${coupon.id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${ctaText} for ${coupon.title}`}
              className="clipupp-coupon-cta h-12 w-full text-[13px] uppercase tracking-wide"
            >
              {ctaText}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
