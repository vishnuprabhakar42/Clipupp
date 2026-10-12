import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import type { FeedCoupon, FeedStore } from "@/lib/home/feed";
import { timeAgo } from "@/lib/format/timeAgo";
import { shortCount } from "@/lib/format/short";
import { wrapNumbers } from "@/lib/format/wrapNumbers";
import { expiresToday } from "@/features/catalog/lib/expiresToday";
import { RevealButton } from "./RevealButton";
import { SaveHeart } from "./SaveHeart";
import { StoreTile } from "./StoreTile";
import { CouponRow } from "./CouponRow";

export type CouponCardProps = {
  coupon: FeedCoupon;
  store: FeedStore;
  category?: { name: string } | null;
  variant?: "card" | "row";
  index?: number;
  priority?: boolean;
};

const HOVER =
  "transition-[transform,box-shadow] duration-200 motion-reduce:transition-none lg:hover:-translate-y-[3px] lg:hover:shadow-clipupp-hover motion-reduce:lg:hover:translate-y-0";

/**
 * Coupon card v3 (server). `card` is the ticket stub used in rails, `row` is
 * the horizontal list item. Time-derived text is computed on the server so it
 * cannot mismatch on hydration; the client leaves are SaveHeart and
 * RevealButton.
 */
export async function CouponCard({ coupon, store, category = null, variant = "card", index = 0 }: CouponCardProps) {
  const t = await getTranslations("catalog.card");
  const ago = timeAgo(coupon.verifiedAt);
  const verified = ago ? t("verified", { ago: t("ago", { unit: ago.unit, n: ago.n }) }) : null;
  const endsToday = expiresToday(coupon.expiresAt);
  const k = { "--k": Math.min(index, 8) } as React.CSSProperties;
  const used = t("used", { count: shortCount(coupon.uses) });
  const success = coupon.success != null ? t("success", { rate: coupon.success }) : null;

  if (variant === "row") {
    return <CouponRow coupon={coupon} store={store} category={category} index={index} />;
  }

  return (
    <article
      data-coupon-card
      data-coupon-id={coupon.id}
      style={k}
      className={`clipupp-rise flex min-w-0 flex-col rounded-2xl border border-clipupp-neutral-200 bg-clipupp-surface p-[18px] ${HOVER}`}
    >
      <div className="flex items-center gap-3">
        <StoreTile store={store} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-clipupp-neutral-900">{store.name}</p>
          {category && <p className="truncate text-[12px] text-clipupp-neutral-500">{category.name}</p>}
        </div>
        <SaveHeart couponId={coupon.id} storeName={store.name} className="-mr-2 -mt-2 self-start" />
      </div>
      <h3 className="mt-3 font-display text-[20px] font-semibold leading-tight text-clipupp-neutral-900">
        {wrapNumbers(coupon.title)}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-snug text-clipupp-neutral-500">{coupon.terms}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {verified && <Tag tone="ok">{verified}</Tag>}
        {coupon.exclusive && <Tag tone="gold">{t("exclusive")}</Tag>}
        {endsToday && <Tag tone="bad">{t("endsToday")}</Tag>}
      </div>
      <div
        aria-hidden
        className="relative -mx-[18px] my-4 border-t-2 border-dashed border-clipupp-neutral-200 before:absolute before:-left-3 before:-top-3 before:h-6 before:w-6 before:rounded-full before:bg-clipupp-neutral-50 before:content-[''] after:absolute after:-right-3 after:-top-3 after:h-6 after:w-6 after:rounded-full after:bg-clipupp-neutral-50 after:content-['']"
      />
      <div className="mb-3 flex items-center justify-between gap-2 text-[12.5px]">
        {success ? (
          <span className="inline-flex items-center gap-1 font-medium text-clipupp-success">
            <ShieldCheck size={14} aria-hidden />
            {success}
          </span>
        ) : (
          <span />
        )}
        <span className="text-clipupp-neutral-500">{used}</span>
      </div>
      <RevealButton coupon={coupon} store={store} category={category} index={index} />
    </article>
  );
}

function Tag({ tone, children }: { tone: "ok" | "gold" | "bad"; children: React.ReactNode }) {
  const cls = {
    ok: "bg-clipupp-ok-bg text-clipupp-success",
    gold: "bg-clipupp-deep text-clipupp-gold",
    bad: "bg-clipupp-bad-bg text-clipupp-danger",
  }[tone];
  return <span className={`rounded-md px-2 py-1 text-[11.5px] font-semibold leading-none ${cls}`}>{children}</span>;
}
