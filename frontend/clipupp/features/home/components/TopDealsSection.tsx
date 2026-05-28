import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { CheckCircle2, Sparkles, Tag, Flame } from "lucide-react";
import { couponsApi } from "@/lib/api/coupons";
import type { CouponSummary } from "@/lib/api/types";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * "Top Deals" — coupon card grid. Brand-tinted top band with logo + savings
 * over a soft brand wash; corner ribbon ("HOT") on the top-3. CTA pinned at
 * the bottom (amber for codes, crimson for deals).
 *
 * Server-rendered: prefers `section.coupons` from the homepage payload; falls
 * back to `couponsApi.top(limit)` only when the admin hasn't pinned items.
 */
export async function TopDealsSection({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const limit = section?.itemLimit ?? 10;
  const heading = section?.title ?? "Top Deals";
  const preloaded = (section?.coupons as CouponSummary[] | null | undefined) ?? null;

  const coupons: CouponSummary[] = preloaded ?? (await safeFetch(limit));

  return (
    <section aria-labelledby="top-deals-heading">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h2 id="top-deals-heading" className="clipupp-eyebrow-vivid">{heading}</h2>
        </div>
        <Link
          href="/coupons"
          className="text-sm font-medium text-clipupp-primary-700 hover:underline"
        >
          See all deals →
        </Link>
      </div>

      {coupons.length === 0 ? (
        <p className="clipupp-meta">No active deals right now — check back soon.</p>
      ) : (
        <ul className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
          {coupons.slice(0, 8).map((c, i) => (
            <li key={c.id} className="h-full">
              <DealCard coupon={c} isHot={i < 3} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function safeFetch(limit: number): Promise<CouponSummary[]> {
  try {
    return await couponsApi.top(limit);
  } catch {
    return [];
  }
}

function DealCard({ coupon, isHot }: { coupon: CouponSummary; isHot: boolean }) {
  const href = `/coupons/${coupon.slug}`;
  const isCode = coupon.type === "CODE";
  const savings = coupon.savingsLabel
    ? coupon.savingsLabel.replace(/\s*(off|back)\s*$/i, "").trim()
    : null;

  return (
    <Link
      href={href}
      className="clipupp-card group relative flex h-full min-h-[260px] flex-col overflow-hidden bg-white"
    >
      {isHot && (
        <span className="clipupp-ribbon-corner" aria-hidden>
          <span className="clipupp-ribbon-corner__inner">Hot</span>
        </span>
      )}

      {/* Brand-tinted header band */}
      <div className="flex items-center gap-3 bg-clipupp-neutral-100 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md bg-white">
          {coupon.storeLogoUrl ? (
            <Image
              src={coupon.storeLogoUrl}
              alt={coupon.storeName ?? ""}
              width={40}
              height={40}
              sizes="44px"
              className="max-h-full w-auto max-w-full object-contain"
            />
          ) : (
            <span className="text-[11px] font-extrabold uppercase text-clipupp-neutral-500">
              {(coupon.storeName ?? "?").trim().charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          {coupon.storeName && (
            <p className="truncate font-display text-[12px] font-extrabold uppercase tracking-[0.12em] text-clipupp-neutral-600">
              {coupon.storeName}
            </p>
          )}
          {savings && (
            <p className="clipupp-text-gradient-savings mt-0.5 font-display text-[1.5rem] font-extrabold leading-none tabular-nums">
              {savings}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 pt-3">
        <p className="line-clamp-2 min-h-[42px] clipupp-h3 group-hover:text-clipupp-primary-700">
          {coupon.title}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {coupon.verified && (
            <span className="clipupp-badge-verified">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Verified
            </span>
          )}
          {coupon.exclusive && (
            <span className="clipupp-badge-exclusive">
              <Sparkles className="h-3 w-3" aria-hidden />
              Exclusive
            </span>
          )}
        </div>
      </div>

      {/* CTA pinned to bottom — different colour by type */}
      <span
        className={`${isCode ? "clipupp-btn-accent-gradient" : "clipupp-btn-primary-gradient"} mt-auto w-full rounded-none text-[13px] font-extrabold uppercase tracking-wide`}
      >
        {isCode ? (
          <>
            <Flame className="h-3.5 w-3.5" aria-hidden strokeWidth={2.5} />
            Get code
          </>
        ) : (
          <>
            <Tag className="h-3.5 w-3.5" aria-hidden />
            Get deal
          </>
        )}
      </span>
    </Link>
  );
}
