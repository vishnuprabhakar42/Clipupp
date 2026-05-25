import { Link } from "@/lib/i18n/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SaveCouponButton } from "@/features/savedcoupons/components/SaveCouponButton";
import { CouponCountdown } from "./CouponCountdown";
import { CouponShareMenu } from "./CouponShareMenu";
import type { CouponSummary } from "@/lib/api/types";

/**
 * Polished coupon card. Whole card is a link to the coupon detail page; save
 * + share controls live in a small toolbar in the upper-right that does not
 * propagate clicks. Verified, exclusive, and savings-label badges are inline
 * — no chip soup. Live countdown footer + used-count for social proof.
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
  return (
    <article
      className="cv-card group relative flex h-full flex-col overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-[var(--cv-primary-strong)]/40"
      aria-label={`${coupon.title} — ${storeName ?? "deal"}`}
    >
      <Link
        href={href}
        className="absolute inset-0"
        aria-label={`View ${coupon.title}`}
      />

      <div className="relative flex items-start justify-between gap-3 p-4 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          {storeLogoUrl && (
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={storeLogoUrl}
                alt=""
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </span>
          )}
          {storeName && (
            <span className="truncate text-xs text-muted-foreground">
              {storeName}
            </span>
          )}
        </div>
        <div className="relative z-10 flex items-center gap-1">
          <CouponShareMenu url={href} title={coupon.title} iconOnly />
          <SaveCouponButton couponId={coupon.id} iconOnly initialSaved={initialSaved} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {coupon.savingsLabel && (
            <Badge className="bg-cv-primary text-white hover:bg-cv-primary-strong">
              {coupon.savingsLabel}
            </Badge>
          )}
          {coupon.verified && (
            <Badge
              variant="outline"
              className="border-cv-success/30 bg-cv-success-soft text-cv-success-strong"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden />
              Verified
            </Badge>
          )}
          {coupon.exclusive && (
            <Badge
              variant="outline"
              className="border-cv-accent/30 bg-cv-accent-soft text-cv-accent-strong"
            >
              <Sparkles className="mr-1 h-3 w-3" aria-hidden />
              Exclusive
            </Badge>
          )}
          <Badge
            variant="secondary"
            className="ml-auto text-[10px] uppercase tracking-wide"
          >
            {labelForType(coupon.type)}
          </Badge>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-cv-primary">
            {coupon.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {coupon.description}
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-2 px-4 py-3 pt-2 text-xs text-muted-foreground">
        <CouponCountdown expiresAt={coupon.expiresAt} />
        {coupon.usedCount > 0 && (
          <span className="tabular-nums">{coupon.usedCount.toLocaleString()} used</span>
        )}
      </div>

      {/* Faux-coupon edge perforation — purely decorative. */}
      <span className="pointer-events-none absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background ring-1 ring-border" aria-hidden />
      <span className="pointer-events-none absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background ring-1 ring-border" aria-hidden />
    </article>
  );
}

function labelForType(t: CouponSummary["type"]) {
  switch (t) {
    case "CODE":
      return "Code";
    case "DEAL":
      return "Deal";
    case "FREE_SHIPPING":
      return "Free shipping";
    case "IN_STORE":
      return "In-store";
  }
}
