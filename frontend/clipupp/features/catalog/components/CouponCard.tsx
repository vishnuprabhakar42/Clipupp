import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { HomepageCouponSummary } from "@/lib/api/homepage";
import { timeAgo } from "@/lib/format/timeAgo";
import { formatCount } from "@/lib/format/number";
import { ctaLabel, headline } from "@/features/catalog/lib/couponCta";
import { ShowCodeButton } from "./ShowCodeButton";

export type CouponCardData = Pick<
  HomepageCouponSummary,
  | "id" | "slug" | "type" | "code" | "title" | "description" | "savingsLabel"
  | "expiresAt" | "verified" | "verifiedAt" | "usedCount"
  | "storeName" | "storeSlug" | "storeLogoUrl" | "categorySlugs"
>;

const TYPE_LABEL: Record<CouponCardData["type"], string> = {
  CODE: "Code",
  DEAL: "Deal",
  FREE_SHIPPING: "Free shipping",
  IN_STORE: "In-store",
};

const USAGE_FLOOR = 50;

function expiresToday(iso: string | null): boolean {
  if (!iso) return false;
  const t = new Date(iso);
  const now = new Date();
  return t.getTime() > now.getTime() && t.toDateString() === now.toDateString();
}

function categoryLabel(c: CouponCardData): string {
  const slug = c.categorySlugs?.[0];
  if (!slug) return TYPE_LABEL[c.type];
  return slug.split("-")[0].replace(/^\w/, (m) => m.toUpperCase());
}

/**
 * The single coupon card family (spec block 2). Server component; the only
 * client leaf is ShowCodeButton. `variant="card"` is the vertical card used
 * in the hero fan and the trending rail; `variant="row"` is the horizontal
 * list layout used by the tabbed section. `interactive={false}` renders the
 * decorative hero copies: code visible, no button, aria-hidden by the parent.
 */
export function CouponCard({
  coupon,
  variant = "card",
  interactive = true,
  priority = false,
  index = 0,
}: {
  coupon: CouponCardData;
  variant?: "card" | "row";
  interactive?: boolean;
  priority?: boolean;
  index?: number;
}) {
  const verifiedAgo = coupon.verified ? timeAgo(coupon.verifiedAt) : null;
  const endsToday = expiresToday(coupon.expiresAt);
  const hasCode = Boolean(coupon.code && coupon.code.trim());
  const logo = coupon.storeLogoUrl ? (
    <Image
      src={coupon.storeLogoUrl}
      alt=""
      width={40}
      height={40}
      priority={priority}
      className="h-full w-full object-contain"
    />
  ) : (
    <span className="text-[13px] font-semibold text-clipupp-primary">
      {(coupon.storeName ?? "?").slice(0, 2).toUpperCase()}
    </span>
  );

  if (variant === "row") {
    return (
      <article
        data-coupon-card
        className="clipupp-reveal grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-xl border border-clipupp-neutral-200 bg-white p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-clipupp-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:grid-cols-[auto_minmax(0,1fr)_auto] md:px-5"
        style={{ "--i": Math.min(index, 5) } as React.CSSProperties}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-clipupp-neutral-100 bg-white p-1">
          {logo}
        </span>
        <div className="min-w-0">
          <span className="block text-[13px] font-medium text-clipupp-neutral-500">{coupon.storeName}</span>
          <h3 className="font-display text-[20px] font-semibold leading-tight text-clipupp-neutral-900">
            <Link href={`/coupons/${coupon.slug}`} className="hover:text-clipupp-primary">
              {headline(coupon)}
            </Link>
          </h3>
          <div className="mt-0.5 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] tabular-nums text-clipupp-neutral-700">
            {verifiedAgo && <span className="font-medium text-clipupp-success">✓ Verified {verifiedAgo}</span>}
            {hasCode && <span>Code {coupon.code}</span>}
            {endsToday && <span className="font-medium text-clipupp-danger">Ends today</span>}
          </div>
        </div>
        {interactive && (
          <ShowCodeButton
            couponId={coupon.id}
            code={coupon.code}
            label={ctaLabel(coupon)}
            className="col-span-2 h-10 md:col-span-1 md:w-auto md:px-4"
          />
        )}
      </article>
    );
  }

  return (
    <article
      data-coupon-card
      className="clipupp-reveal flex min-w-0 flex-col gap-3 rounded-xl border border-clipupp-neutral-200 bg-white p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-clipupp-tint-200 hover:shadow-clipupp-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ "--i": Math.min(index, 5) } as React.CSSProperties}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-clipupp-neutral-100 bg-white p-1">
          {logo}
        </span>
        <span
          className={
            "rounded px-2.5 py-1.5 text-[12px] font-medium leading-none " +
            (endsToday ? "bg-clipupp-danger-soft text-clipupp-danger" : "bg-clipupp-tint-100 text-clipupp-primary")
          }
        >
          {endsToday ? "Ends today" : categoryLabel(coupon)}
        </span>
      </div>
      <div>
        <span className="block text-[13px] font-medium text-clipupp-neutral-500">{coupon.storeName}</span>
        <h3 className="font-display text-[22px] font-semibold leading-tight tabular-nums text-clipupp-neutral-900">
          {interactive ? (
            <Link href={`/coupons/${coupon.slug}`} className="hover:text-clipupp-primary">
              {headline(coupon)}
            </Link>
          ) : (
            headline(coupon)
          )}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[14px] text-clipupp-neutral-700">{coupon.description}</p>
      </div>
      {hasCode && (
        <div className="flex h-10 items-center justify-between gap-2 rounded-lg border border-dashed border-clipupp-primary bg-clipupp-tint-50 pl-3.5 pr-1.5 text-[15px] font-semibold tracking-[0.06em] text-clipupp-primary tabular-nums">
          <span className={interactive ? "clipupp-code-peel" : undefined}>{coupon.code}</span>
          <span className="rounded bg-clipupp-tint-100 px-2.5 py-1.5 text-[12px] font-medium leading-none">
            {interactive ? "Tap to reveal" : "Code"}
          </span>
        </div>
      )}
      <div className="flex flex-col items-start gap-1 text-[13px]">
        {verifiedAgo && (
          <span className="inline-flex items-center gap-1.5 font-medium text-clipupp-success">
            ✓ Verified {verifiedAgo}
          </span>
        )}
        {coupon.usedCount >= USAGE_FLOOR && (
          <span className="tabular-nums text-clipupp-neutral-500">Used {formatCount(coupon.usedCount)} times</span>
        )}
      </div>
      {interactive && <ShowCodeButton couponId={coupon.id} code={coupon.code} label={ctaLabel(coupon)} />}
    </article>
  );
}
