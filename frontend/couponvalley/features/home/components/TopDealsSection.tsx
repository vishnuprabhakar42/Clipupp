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
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="cv-skeleton h-[300px] rounded-xl" />
          ))}
        </ul>
      ) : (coupons?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active deals right now — check back soon.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {coupons!.slice(0, 8).map((c) => (
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
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Brand-color top with logo. p-6 carves uniform breathing room so
          every logo (square Apple / landscape Decathlon / portrait) fits the
          same inner box at a consistent visible size. */}
      <div
        className="relative flex h-[140px] items-center justify-center overflow-hidden p-6"
        style={{ backgroundColor: bg }}
      >
        {/* Savings pill — top-right per design spec */}
        {savings && (
          <div className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold shadow-sm">
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
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </>
        ) : (
          <span className="text-base font-bold text-white">{coupon.storeName ?? "Deal"}</span>
        )}
      </div>

      {/* White bottom — flex-col so the CTA pins to the bottom regardless of
          how long the title runs (line-clamp-2 caps it at 2 lines). */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {coupon.storeName && (
          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-gray-700">
            {coupon.storeName}
          </p>
        )}
        <p className="line-clamp-2 min-h-[40px] text-sm leading-snug text-gray-900">
          {coupon.title}
        </p>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
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

        {/* CTA — always pinned at the bottom via mt-auto */}
        <span className="mt-auto inline-flex w-full items-center justify-center gap-1 rounded-md bg-cv-primary px-3 py-2 text-[12px] font-bold uppercase tracking-wide text-white transition group-hover:bg-cv-primary-strong">
          <Tag className="h-3 w-3" aria-hidden />
          {isCode ? "Get Code" : "Get Deal"}
        </span>
      </div>
    </Link>
  );
}
