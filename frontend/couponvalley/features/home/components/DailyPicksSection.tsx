import Image from "next/image";
import { ArrowRight, Sparkles, Tag, Clock } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { couponsApi } from "@/lib/api/coupons";
import type { HomepageSectionPayload } from "@/lib/api/homepage";
import type { CouponSummary } from "@/lib/api/types";

/**
 * Editor's-picks section. Asymmetric 2-column layout (different visual
 * rhythm from the uniform `TopDeals` grid):
 *   • Left: one large featured deal with cv-gradient-warm hero band + corner
 *     ribbon, big amber-gradient savings number, gradient CTA.
 *   • Right: three small horizontal-row deals with left-edge gradient bars.
 *
 * Data: pre-loaded `section.coupons` from the homepage payload when admin
 * pinned specific items; otherwise top-4 popularity-sorted coupons. Server-
 * rendered.
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
          <h2
            id="daily-picks-heading"
            className="cv-eyebrow-vivid cv-eyebrow-vivid--accent"
          >
            {heading}
          </h2>
          <p className="cv-body mt-2 max-w-xl text-cv-neutral-700">{subtitle}</p>
        </div>
        <Link
          href="/coupons"
          className="text-sm font-bold text-cv-primary-700 hover:underline"
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
      className="cv-card group relative flex h-full min-h-[260px] flex-col overflow-hidden"
    >
      <span className="cv-ribbon-corner" aria-hidden>
        <span className="cv-ribbon-corner__inner">Pick</span>
      </span>

      {/* Hero band — soft primary tint with logo + "Editor's pick" eyebrow.
          No gradient (gradients reserved for hero/CTA only). */}
      <div className="relative flex aspect-[16/7] items-center justify-center overflow-hidden bg-cv-primary-soft p-6">
        {coupon.storeLogoUrl ? (
          <span className="grid h-20 w-44 place-items-center rounded-xl bg-white p-3">
            <Image
              src={coupon.storeLogoUrl}
              alt={coupon.storeName ?? ""}
              width={150}
              height={64}
              sizes="180px"
              className="max-h-full w-auto max-w-full object-contain"
            />
          </span>
        ) : (
          <span
            aria-hidden
            className="grid h-16 w-16 place-items-center rounded-full bg-white text-2xl font-extrabold text-cv-accent-700"
          >
            {(coupon.storeName ?? "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-cv-primary backdrop-blur-sm">
          <Sparkles className="h-3 w-3" aria-hidden strokeWidth={2} />
          Editor's pick
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {coupon.storeName && (
          <p className="cv-eyebrow-vivid">{coupon.storeName}</p>
        )}
        <h3 className="cv-h2 line-clamp-2 text-[1.25rem] leading-tight lg:text-[1.375rem] group-hover:text-cv-primary-700">
          {coupon.title}
        </h3>
        {savings && (
          <p className="cv-savings-massive text-cv-primary">
            {savings}
            <span className="ml-1 font-display text-[1rem] font-bold uppercase tracking-[0.12em] text-cv-neutral-500">
              OFF
            </span>
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="cv-meta inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden />
            Curated today
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-cv-primary-700 group-hover:underline">
            <Tag className="h-3.5 w-3.5" aria-hidden />
            View deal
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
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
      className="cv-card cv-edge-bar group flex h-full items-center gap-3 p-3"
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
          <span className="text-xs font-extrabold uppercase text-cv-neutral-500">
            {(coupon.storeName ?? "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        {coupon.storeName && (
          <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.12em] text-cv-neutral-500">
            {coupon.storeName}
          </p>
        )}
        <p className="line-clamp-1 text-sm font-bold text-cv-neutral-900 group-hover:text-cv-primary-700">
          {coupon.title}
        </p>
        {savings && (
          <p className="mt-0.5 font-display text-[14px] font-extrabold tabular-nums text-cv-primary">
            {savings} Off
          </p>
        )}
      </div>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-cv-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-cv-primary-700"
        aria-hidden
      />
    </Link>
  );
}
