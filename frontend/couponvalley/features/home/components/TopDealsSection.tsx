"use client";

import { Link } from "@/lib/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Sparkles, Tag } from "lucide-react";
import { couponsApi } from "@/lib/api/coupons";
import type { CouponSummary } from "@/lib/api/types";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * "Top Deals" deal cards — uses pinned coupons from the homepage layout
 * payload when supplied, otherwise falls back to the popularity-sorted top.
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
      <div className="mb-5 flex items-end justify-between gap-3">
        <h2 id="top-deals-heading" className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          {heading}
        </h2>
        <Link
          href="/coupons"
          className="text-sm font-semibold text-cv-primary hover:underline"
        >
          See all deals
        </Link>
      </div>

      {!preloaded && q.isLoading ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <li key={i} className="cv-skeleton h-[260px] rounded-md" />
          ))}
        </ul>
      ) : (coupons?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active deals right now — check back soon.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {coupons!.map((c) => (
            <li key={c.id}>
              <DealCard coupon={c} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DealCard({ coupon }: { coupon: CouponSummary }) {
  const bg = coupon.storeBrandColor || "#1f2937";
  const href = `/coupons/${coupon.slug}`;
  const isCode = coupon.type === "CODE";
  // Strip trailing "off"/"back" from the API label and always render "Off"
  // — cashback is Phase 2; today every deal is just a discount.
  const savings = coupon.savingsLabel
    ? coupon.savingsLabel.replace(/\s*(off|back)\s*$/i, "").trim()
    : null;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-md border border-gray-200 bg-white transition hover:shadow-md"
    >
      {/* Brand-color top with logo. overflow-hidden enforces the 120 px frame
          no matter how large the source image is. */}
      <div
        className="relative flex h-[120px] items-center justify-center overflow-hidden"
        style={{ backgroundColor: bg }}
      >
        {/* Savings pill — top-left */}
        {savings && (
          <div className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold shadow-sm">
            <Tag className="h-2.5 w-2.5 text-cv-accent" aria-hidden />
            <span className="text-gray-900">
              {savings}
              <span className="ml-0.5 text-cv-neutral-500"> Off</span>
            </span>
          </div>
        )}

        {/* Logo */}
        {coupon.storeLogoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coupon.storeLogoUrl}
              alt={coupon.storeName ?? ""}
              className="max-h-[55%] max-w-[75%] object-contain"
              loading="lazy"
            />
          </>
        ) : (
          <span className="text-base font-bold text-white">{coupon.storeName ?? "Deal"}</span>
        )}
      </div>

      {/* White bottom */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {coupon.storeName && (
          <p className="line-clamp-1 text-[11px] font-bold uppercase tracking-wide text-gray-700">
            {coupon.storeName}
          </p>
        )}
        <p className="line-clamp-2 min-h-[40px] text-sm leading-snug text-gray-900">
          {coupon.title}
        </p>

        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
            {isCode ? (
              <>
                <Tag className="h-2.5 w-2.5" aria-hidden />
                Coupon code
              </>
            ) : (
              <>
                <Tag className="h-2.5 w-2.5" aria-hidden />
                Sale
              </>
            )}
          </span>
          {coupon.verified && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-cv-success-strong">
              <CheckCircle2 className="h-2.5 w-2.5" aria-hidden />
              Verified
            </span>
          )}
          {coupon.exclusive && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-cv-accent-strong">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              Exclusive
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
