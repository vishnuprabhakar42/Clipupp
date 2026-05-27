import Image from "next/image";
import { ArrowRight, Sparkles, Tag, Clock } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { couponsApi } from "@/lib/api/coupons";
import type { HomepageSectionPayload } from "@/lib/api/homepage";
import type { CouponSummary } from "@/lib/api/types";

/**
 * Editor's-picks section. Asymmetric 2-column layout (different visual
 * rhythm from the uniform `TopDeals` grid):
 *   • Left: one large featured deal with cover-image / brand tile + meta.
 *   • Right: three small horizontal-list deals stacked.
 *
 * Data: uses pre-loaded `coupons` on the section payload when the admin
 * pinned specific items; otherwise falls back to the top 4 popularity-
 * sorted coupons. Server-rendered.
 */
export async function DailyPicksSection({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Today's editor's picks";
  const subtitle =
    section?.subtitle ??
    "Four hand-curated deals our team is excited about today. Refreshed every morning.";

  const preloaded = (section?.coupons ?? null) as CouponSummary[] | null;
  const picks: CouponSummary[] =
    preloaded && preloaded.length > 0
      ? preloaded
      : await couponsApi.top(4).catch(() => []);

  if (picks.length === 0) return null;

  const [featured, ...rest] = picks.slice(0, 4);
  if (!featured) return null;

  return (
    <section aria-labelledby="daily-picks-heading">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="cv-tag bg-transparent px-0 text-cv-accent">Daily picks</p>
          <h2 id="daily-picks-heading" className="cv-h2 mt-2">
            {heading}
          </h2>
          <p className="cv-body mt-2 max-w-xl text-cv-neutral-600">{subtitle}</p>
        </div>
        <Link
          href="/coupons"
          className="text-sm font-semibold text-cv-primary hover:underline"
        >
          See all →
        </Link>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-5">
        <FeaturedPick coupon={featured} />
        <ul className="flex flex-col gap-3">
          {rest.map((c) => (
            <li key={c.id} className="h-full">
              <SmallPick coupon={c} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────────  Featured card  ─────────────────────────── */

function FeaturedPick({ coupon }: { coupon: CouponSummary }) {
  const href = `/coupons/${coupon.slug}`;
  const savings = coupon.savingsLabel
    ? coupon.savingsLabel.replace(/\s*(off|back)\s*$/i, "").trim()
    : null;

  return (
    <Link
      href={href}
      className="group flex h-full min-h-[260px] flex-col overflow-hidden rounded-lg border border-cv-neutral-200 bg-white shadow-card"
    >
      {/* Hero band — flat brand tint with logo + savings overlay */}
      <div className="relative flex aspect-[16/7] items-center justify-center overflow-hidden border-b border-cv-neutral-200 bg-cv-accent-soft p-6">
        {coupon.storeLogoUrl ? (
          <Image
            src={coupon.storeLogoUrl}
            alt={coupon.storeName ?? ""}
            width={220}
            height={100}
            sizes="(min-width: 1024px) 560px, 100vw"
            className="max-h-full w-auto max-w-full object-contain"
          />
        ) : (
          <span
            aria-hidden
            className="grid h-16 w-16 place-items-center rounded-full bg-cv-accent text-2xl font-semibold text-white"
          >
            {(coupon.storeName ?? "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-sm bg-cv-accent px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
          <Sparkles className="h-3 w-3" aria-hidden />
          Editor's pick
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {coupon.storeName && (
          <p className="cv-tag bg-transparent px-0">{coupon.storeName}</p>
        )}
        <h3 className="cv-h2 line-clamp-2 text-[1.25rem] leading-tight lg:text-[1.375rem]">
          {coupon.title}
        </h3>
        {savings && (
          <p className="cv-price">
            {savings}
            <span className="ml-1 text-sm font-semibold uppercase tracking-[0.04em] text-cv-neutral-500">
              Off
            </span>
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-cv-neutral-500">
            <Clock className="h-3 w-3" aria-hidden />
            Curated today
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-cv-primary group-hover:underline">
            <Tag className="h-3.5 w-3.5" aria-hidden />
            View deal
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ──────────────────────────────  Small row  ────────────────────────────── */

function SmallPick({ coupon }: { coupon: CouponSummary }) {
  const href = `/coupons/${coupon.slug}`;
  const savings = coupon.savingsLabel
    ? coupon.savingsLabel.replace(/\s*(off|back)\s*$/i, "").trim()
    : null;

  return (
    <Link
      href={href}
      className="group flex h-full items-center gap-3 rounded-lg border border-cv-neutral-200 bg-white p-3 shadow-card"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-cv-neutral-200 bg-white">
        {coupon.storeLogoUrl ? (
          <Image
            src={coupon.storeLogoUrl}
            alt={coupon.storeName ?? ""}
            width={40}
            height={40}
            sizes="48px"
            className="max-h-full w-auto max-w-full object-contain"
          />
        ) : (
          <span className="text-xs font-semibold uppercase text-cv-neutral-500">
            {(coupon.storeName ?? "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        {coupon.storeName && (
          <p className="cv-tag bg-transparent px-0">{coupon.storeName}</p>
        )}
        <p className="line-clamp-1 text-sm font-semibold text-cv-neutral-900 group-hover:text-cv-primary">
          {coupon.title}
        </p>
        {savings && (
          <p className="mt-0.5 text-[13px] font-semibold text-cv-accent-strong tabular-nums">
            {savings} Off
          </p>
        )}
      </div>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-cv-neutral-300 group-hover:text-cv-primary"
        aria-hidden
      />
    </Link>
  );
}
