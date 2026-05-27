"use client";

import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Sparkles, Tag } from "lucide-react";
import { couponsApi } from "@/lib/api/coupons";
import type { CouponSummary } from "@/lib/api/types";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * "Top Deals" — coupon card grid. Follows the platform coupon card contract:
 *   • Logo (40×40 white tile with 1px border)
 *   • Headline (max 2 lines)
 *   • Savings badge
 *   • Verified/exclusive meta
 *   • One full-width CTA pinned at the bottom (`mt-auto`)
 *
 * 1 → 2 → 3 → 4 cols. Cards stretch via `items-stretch` so a row never has
 * different heights regardless of how long any single headline runs.
 */
export function TopDealsSection({ section }: { section?: HomepageSectionPayload | null }) {
  const limit = section?.itemLimit ?? 10;
  const heading = section?.title ?? "Top Deals";
  const preloaded = section?.coupons as CouponSummary[] | null | undefined;

  const q = useQuery({
    queryKey: ["home", "top-deals", limit],
    queryFn: () => couponsApi.top(limit),
    staleTime: 60_000,
    enabled: !preloaded,
  });

  const coupons = preloaded ?? q.data ?? null;

  return (
    <section aria-labelledby="top-deals-heading">
      <div className="mb-6 flex items-end justify-between gap-3">
        <h2 id="top-deals-heading" className="cv-h2">
          {heading}
        </h2>
        <Link
          href="/coupons"
          className="text-sm font-semibold text-cv-primary hover:underline"
        >
          See all deals →
        </Link>
      </div>

      {!preloaded && q.isLoading ? (
        <ul className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="cv-skeleton h-[280px] rounded-lg" />
          ))}
        </ul>
      ) : (coupons?.length ?? 0) === 0 ? (
        <p className="cv-meta">No active deals right now — check back soon.</p>
      ) : (
        <ul className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
          {coupons!.slice(0, 8).map((c) => (
            <li key={c.id} className="h-full">
              <DealCard coupon={c} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DealCard({ coupon }: { coupon: CouponSummary }) {
  const href = `/coupons/${coupon.slug}`;
  const isCode = coupon.type === "CODE";
  const savings = coupon.savingsLabel
    ? coupon.savingsLabel.replace(/\s*(off|back)\s*$/i, "").trim()
    : null;

  return (
    <Link
      href={href}
      className="group flex h-full min-h-[260px] flex-col overflow-hidden rounded-lg border border-cv-neutral-200 bg-white shadow-card"
    >
      <div className="flex items-start gap-3 p-4">
        {/* 40×40 logo tile per image render contract — sized image (not
            `fill`) + single padding level so logos render at readable size
            instead of collapsing into the tile padding. */}
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-cv-neutral-200 bg-white">
          {coupon.storeLogoUrl ? (
            <Image
              src={coupon.storeLogoUrl}
              alt={coupon.storeName ?? ""}
              width={36}
              height={36}
              sizes="40px"
              className="max-h-full w-auto max-w-full object-contain"
            />
          ) : (
            <span className="text-[11px] font-semibold uppercase text-cv-neutral-500">
              {(coupon.storeName ?? "?").trim().charAt(0).toUpperCase()}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          {coupon.storeName && (
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.04em] text-cv-neutral-500">
              {coupon.storeName}
            </p>
          )}
          {savings && (
            <p className="mt-0.5 font-display text-lg font-bold text-cv-primary tabular-nums">
              {savings}
              <span className="ml-1 text-xs font-semibold uppercase tracking-[0.04em] text-cv-neutral-500">
                Off
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4">
        <p className="line-clamp-2 min-h-[40px] cv-body text-cv-neutral-900">
          {coupon.title}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {coupon.verified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cv-success-strong">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Verified
            </span>
          )}
          {coupon.exclusive && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cv-accent-strong">
              <Sparkles className="h-3 w-3" aria-hidden />
              Exclusive
            </span>
          )}
        </div>
      </div>

      {/* Single CTA — full-width, pinned to the bottom via mt-auto */}
      <span className="mt-auto inline-flex items-center justify-center gap-1.5 bg-cv-primary px-3 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-cv-primary-strong">
        <Tag className="h-3.5 w-3.5" aria-hidden />
        {isCode ? "Get code" : "Get deal"}
      </span>
    </Link>
  );
}
