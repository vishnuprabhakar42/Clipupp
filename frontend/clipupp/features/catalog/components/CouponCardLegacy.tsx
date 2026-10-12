import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { HomepageCouponSummary } from "@/lib/api/homepage";
import { timeAgo } from "@/lib/format/timeAgo";
import { formatCount } from "@/lib/format/number";
import { ctaLabel, headline } from "@/features/catalog/lib/couponCta";
import { expiresToday } from "@/features/catalog/lib/expiresToday";
import { categoryLabel } from "@/features/catalog/lib/categoryLabel";
import { ShowCodeButton } from "./ShowCodeButton";

export type CouponCardData = Pick<
  HomepageCouponSummary,
  | "id" | "slug" | "type" | "code" | "title" | "description" | "savingsLabel"
  | "expiresAt" | "verified" | "verifiedAt" | "usedCount"
  | "storeName" | "storeSlug" | "storeLogoUrl" | "categorySlugs"
>;

const TYPE_KEY = {
  CODE: "typeCode",
  DEAL: "typeDeal",
  FREE_SHIPPING: "typeFreeShipping",
  IN_STORE: "typeInStore",
} as const satisfies Record<CouponCardData["type"], string>;

const USAGE_FLOOR = 50;

/**
 * The single coupon card family (spec block 2). Async server component (it
 * localizes with getTranslations); the only client leaf is ShowCodeButton.
 * Time-derived text (verified ago, ends today) is computed once on the
 * server, so it can never mismatch on hydration. `variant="card"` is the vertical card used
 * in the hero fan and the trending rail; `variant="row"` is the horizontal
 * list layout used by the tabbed section. `interactive={false}` renders the
 * decorative hero copies: code visible, no button, aria-hidden by the parent.
 */
export async function CouponCardLegacy({
  coupon,
  variant = "card",
  interactive = true,
  index = 0,
}: {
  coupon: CouponCardData;
  variant?: "card" | "row";
  interactive?: boolean;
  index?: number;
}) {
  const t = await getTranslations("catalog.card");
  const ago = coupon.verified ? timeAgo(coupon.verifiedAt) : null;
  const verifiedAgo = ago ? t("verifiedAgo", { unit: ago.unit, n: ago.n }) : null;
  const firstCategory = coupon.categorySlugs?.[0];
  const tag = firstCategory ? categoryLabel(firstCategory) : t(TYPE_KEY[coupon.type]);
  const endsToday = expiresToday(coupon.expiresAt);
  const hasCode = Boolean(coupon.code && coupon.code.trim());
  const logo = coupon.storeLogoUrl ? (
    <Image
      src={coupon.storeLogoUrl}
      alt=""
      width={40}
      height={40}
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
        className="clipupp-reveal grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-xl border border-clipupp-neutral-200 bg-white p-4 transition-[opacity,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-clipupp-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:grid-cols-[auto_minmax(0,1fr)_auto] md:px-5"
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
            {verifiedAgo && <span className="font-medium text-clipupp-success">{verifiedAgo}</span>}
            {hasCode && (
              <span>
                {t("codeLabel")} <span className="clipupp-code-peel font-semibold tracking-[0.06em]">{coupon.code}</span>
              </span>
            )}
            {endsToday && <span className="font-medium text-clipupp-danger">{t("endsToday")}</span>}
          </div>
        </div>
        {interactive && (
          <ShowCodeButton
            couponId={coupon.id}
            code={coupon.code}
            labelKey={ctaLabel(coupon)}
            className="col-span-2 h-10 md:col-span-1 md:w-auto md:px-4"
          />
        )}
      </article>
    );
  }

  return (
    <article
      data-coupon-card
      className="clipupp-reveal flex min-w-0 flex-col gap-3 rounded-xl border border-clipupp-neutral-200 bg-white p-5 transition-[opacity,transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-clipupp-tint-200 hover:shadow-clipupp-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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
          {endsToday ? t("endsToday") : tag}
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
            {interactive ? t("revealHint") : t("codeLabel")}
          </span>
        </div>
      )}
      <div className="flex flex-col items-start gap-1 text-[13px]">
        {verifiedAgo && (
          <span className="inline-flex items-center gap-1.5 font-medium text-clipupp-success">{verifiedAgo}</span>
        )}
        {coupon.usedCount >= USAGE_FLOOR && (
          <span className="tabular-nums text-clipupp-neutral-500">{t("usedTimes", { count: formatCount(coupon.usedCount) })}</span>
        )}
      </div>
      {interactive && <ShowCodeButton couponId={coupon.id} code={coupon.code} labelKey={ctaLabel(coupon)} />}
    </article>
  );
}
