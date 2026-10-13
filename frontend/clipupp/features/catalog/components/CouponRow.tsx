import { useTranslations } from "next-intl";
import type { FeedCoupon, FeedStore } from "@/lib/home/feed";
import { timeAgo } from "@/lib/format/timeAgo";
import { shortCount } from "@/lib/format/short";
import { expiresToday } from "@/features/catalog/lib/expiresToday";
import { RevealButton } from "./RevealButton";
import { StoreTile } from "./StoreTile";
import { CARD_HOVER, Tag } from "./cardBits";


/**
 * Row variant of the coupon card. A plain (non-async) component using
 * `useTranslations`, so it renders from a server component (CouponCard) and
 * from a client component (the saved sheet) alike.
 */
export function CouponRow({
  coupon,
  store,
  category = null,
  index = 0,
}: {
  coupon: FeedCoupon;
  store: FeedStore;
  category?: { name: string } | null;
  index?: number;
}) {
  const t = useTranslations("catalog.card");
  const ago = timeAgo(coupon.verifiedAt);
  const verified = ago ? t("verified", { ago: t("ago", { unit: ago.unit, n: ago.n }) }) : null;
  const endsToday = expiresToday(coupon.expiresAt);
  const k = { "--k": Math.min(index, 8) } as React.CSSProperties;
  const used = t("used", { count: shortCount(coupon.uses) });
  const success = coupon.success != null ? t("success", { rate: coupon.success }) : null;
  const isDeal = coupon.badge === "Deal";
  return (
    <article
      data-coupon-card
      data-coupon-id={coupon.id}
      style={k}
      className={`clipupp-rise grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-2xl border border-clipupp-neutral-200 bg-clipupp-surface p-4 lg:grid-cols-[auto_minmax(0,1fr)_170px] lg:p-[18px] ${CARD_HOVER}`}
    >
      <div className="grid h-14 w-14 shrink-0 place-content-center rounded-xl bg-clipupp-tint-100 text-center lg:h-16 lg:w-16">
        <span className="text-[19px] font-bold leading-none text-clipupp-primary lg:text-[21px]">{coupon.badge}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-clipupp-primary">
          {isDeal ? t("deal") : t("off")}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <StoreTile store={store} size={20} className="!rounded-md !p-0.5" />
          <span className="text-[13px] text-clipupp-neutral-600">{store.name}</span>
          {coupon.exclusive && <Tag tone="gold">{t("exclusive")}</Tag>}
          {endsToday && <Tag tone="bad">{t("endsToday")}</Tag>}
        </div>
        <h3 className="mt-1 text-[15px] font-semibold leading-snug text-clipupp-neutral-900">{coupon.title}</h3>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-clipupp-neutral-500">
          {verified && <span className="font-medium text-clipupp-success">✓ {verified}</span>}
          {success && <span>{success}</span>}
          <span>{used}</span>
        </div>
      </div>
      <div className="col-span-2 lg:col-span-1">
        <RevealButton coupon={coupon} store={store} category={category} index={index} size="sm" />
      </div>
    </article>
  );
}
