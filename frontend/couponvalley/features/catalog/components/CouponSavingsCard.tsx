import { Link } from "@/lib/i18n/navigation";
import { CheckCircle2, Sparkles, Flame, Tag } from "lucide-react";
import { SaveCouponButton } from "@/features/savedcoupons/components/SaveCouponButton";
import { CouponCountdown } from "./CouponCountdown";
import { CouponShareMenu } from "./CouponShareMenu";
import type { CouponSummary } from "@/lib/api/types";

/**
 * Grid coupon card. Used in carousels (top deals rail, related coupons,
 * editorial picks). Whole card is a link to the coupon detail page; save +
 * share controls live in a small toolbar in the upper-right and don't
 * propagate clicks. Verified/exclusive/savings shown inline as vivid pills.
 *
 * Visual tier (Phase 2 redesign):
 * - Brand-tinted top band (8:3) holding the store logo on a soft brand wash.
 * - Big savings line in amber gradient when present.
 * - Hot/exclusive stripe ribbon (right corner) when applicable.
 */
export function CouponSavingsCard({
  coupon,
  storeName,
  storeLogoUrl,
  initialSaved,
}: {
  coupon: CouponSummary;
  storeName?: string;
  storeLogoUrl?: string;
  initialSaved?: boolean;
}) {
  const href = `/coupons/${coupon.slug}`;
  const isHot =
    (coupon.usedCount ?? 0) >= 50 || (coupon.popularityScore ?? 0) >= 75;
  const savings = (coupon.savingsLabel ?? "").trim();

  return (
    <article
      className="cv-card group relative flex h-full flex-col overflow-hidden focus-within:shadow-glow-primary"
      aria-label={`${coupon.title} — ${storeName ?? "deal"}`}
    >
      {isHot && (
        <span className="cv-ribbon-corner" aria-hidden>
          <span className="cv-ribbon-corner__inner">Hot</span>
        </span>
      )}

      <Link
        href={href}
        className="absolute inset-0 z-0"
        aria-label={`View ${coupon.title}`}
      />

      {/* Brand-tinted top band */}
      <div className="relative grid place-items-center bg-cv-neutral-100 px-4 py-5 aspect-[8/3]">
        {storeLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storeLogoUrl}
            alt={storeName ?? ""}
            className="max-h-12 w-auto max-w-[120px] object-contain"
            loading="lazy"
          />
        ) : storeName ? (
          <span className="font-display text-[15px] font-bold text-cv-neutral-700">
            {storeName}
          </span>
        ) : (
          <Tag className="h-7 w-7 text-cv-primary-400" aria-hidden />
        )}
        {/* Save / share toolbar — above the link overlay */}
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
          <CouponShareMenu url={href} title={coupon.title} iconOnly />
          <SaveCouponButton
            couponId={coupon.id}
            iconOnly
            initialSaved={initialSaved}
          />
        </div>
      </div>

      {/* Body */}
      <div className="relative z-[1] flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        {/* Type / verified / exclusive line */}
        <div className="flex flex-wrap items-center gap-1.5">
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
          {coupon.type === "FREE_SHIPPING" && (
            <span className="cv-pill bg-cv-success-soft text-cv-success-strong">
              Free shipping
            </span>
          )}
        </div>

        {/* Big savings line */}
        {savings && (
          <p className="cv-text-gradient-savings font-display text-[1.5rem] font-extrabold leading-none tabular-nums">
            {savings}
          </p>
        )}

        {/* Title + description */}
        <div className="flex-1">
          <h3 className="cv-h3 line-clamp-2 group-hover:text-cv-primary-700">
            {coupon.title}
          </h3>
          {coupon.description && (
            <p className="cv-meta mt-1.5 line-clamp-2">{coupon.description}</p>
          )}
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <CouponCountdown expiresAt={coupon.expiresAt} />
          {coupon.usedCount > 0 && (
            <span className="cv-meta tabular-nums">
              {coupon.usedCount.toLocaleString()} used
            </span>
          )}
        </div>

        {/* CTA */}
        <a
          href={`/r/${coupon.id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${coupon.type === "CODE" ? "Get code" : "Get deal"} for ${coupon.title}`}
          className={`${coupon.type === "CODE" ? "cv-btn-accent-gradient" : "cv-btn-primary-gradient"} relative z-10 w-full text-[13px] font-extrabold uppercase tracking-wide`}
        >
          {coupon.type === "CODE" ? (
            <>
              <Flame className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
              Get code
            </>
          ) : (
            "Get deal"
          )}
        </a>
      </div>
    </article>
  );
}
