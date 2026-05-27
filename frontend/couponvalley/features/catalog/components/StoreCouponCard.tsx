"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, TrendingUp, Users2 } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { CouponSummary } from "@/lib/api/types";

export function StoreCouponCard({ coupon }: { coupon: CouponSummary }) {
  const [expanded, setExpanded] = useState(false);

  const isCode      = coupon.type === "CODE";
  const isHot       = coupon.usedCount >= 50 || coupon.popularityScore >= 75;
  const isFlashDeal = isHot && (coupon.type === "DEAL" || coupon.type === "FREE_SHIPPING");
  const isRecommended = coupon.exclusive || (coupon.verified && isHot && !isFlashDeal);

  /* Success rate — use popularityScore when meaningful */
  const successRate =
    coupon.popularityScore != null && coupon.popularityScore > 0
      ? Math.min(99, Math.max(70, coupon.popularityScore))
      : null;

  /* CTA button label */
  const ctaText = coupon.savingsLabel
    ? coupon.savingsLabel.toUpperCase()
    : isCode                          ? "GET COUPON CODE"
    : coupon.type === "FREE_SHIPPING" ? "GET FREE SHIPPING"
    : coupon.type === "IN_STORE"      ? "GET IN-STORE DEAL"
    :                                   "GET THIS DEAL";

  /* Partial code preview — last 2 chars, or "ER" placeholder */
  const codeHint = isCode
    ? (coupon.code ? coupon.code.slice(-2).toUpperCase() : "ER")
    : null;

  /* Border + header colours */
  const borderCls = isFlashDeal
    ? "border-cv-accent"
    : isRecommended
    ? "border-cv-primary"
    : "border-gray-200";
  const headerBgCls  = isFlashDeal ? "bg-cv-accent"   : "bg-cv-primary";
  const leftTextCls  = isFlashDeal ? "text-cv-accent" : "text-cv-primary";
  const badgeLabel   = isFlashDeal ? "FLASH DEAL"     : "RECOMMENDED";

  return (
    <article
      className={`overflow-hidden rounded-lg border-2 bg-white shadow-card ${borderCls}`}
    >
      {/* ── Coloured header strip ──────────────────────────────────── */}
      {(isRecommended || isFlashDeal) && (
        <div className={`${headerBgCls} px-5 py-[7px]`}>
          <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-white">
            {badgeLabel}
          </span>
        </div>
      )}

      {/* ── Card body ─────────────────────────────────────────────── */}
      <div className="flex items-stretch">

        {/* LEFT — savings label, ~160 px */}
        <div className="flex w-[160px] shrink-0 items-center justify-center px-5 py-7">
          <p className={`text-center text-[2.1rem] font-black uppercase leading-[1.2] tracking-tight ${leftTextCls}`}>
            {coupon.savingsLabel?.toUpperCase() ??
              coupon.title.split(" ").slice(0, 3).join(" ").toUpperCase()}
          </p>
        </div>

        {/* Vertical dashed separator */}
        <div className="my-5 w-0 self-stretch border-l-2 border-dashed border-gray-200" />

        {/* CENTER — title + "Show Details" expand */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-6 py-6">
          <Link href={`/coupons/${coupon.slug}`}>
            <h3 className="text-[18px] font-semibold leading-snug text-gray-900 transition-colors hover:text-cv-primary">
              {coupon.title}
            </h3>
          </Link>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex w-fit items-center gap-1 text-[13px] font-medium text-cv-primary hover:underline"
          >
            Show Details
            {expanded
              ? <ChevronUp   className="h-3.5 w-3.5" aria-hidden />
              : <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            }
          </button>
          {expanded && coupon.description && (
            <p className="text-[13px] leading-relaxed text-gray-600">
              {coupon.description}
            </p>
          )}
        </div>

        {/* RIGHT — stats + CTA */}
        <div className="flex w-[360px] shrink-0 flex-col justify-center gap-3 px-5 py-5">

          {/* Stats row — smaller text */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
            {coupon.verified && (
              <>
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-[13px] w-[13px] text-cv-success" aria-hidden />
                  Verified
                </span>
                <span className="text-gray-300" aria-hidden>•</span>
              </>
            )}
            {successRate !== null && (
              <>
                <span className="flex items-center gap-1 font-medium">
                  <TrendingUp className="h-3 w-3 text-cv-success" aria-hidden />
                  <span className="font-bold text-cv-success">{successRate}%</span>
                  {" "}Success
                </span>
                <span className="text-gray-300" aria-hidden>•</span>
              </>
            )}
            {coupon.usedCount > 0 && (
              <span className="flex items-center gap-1 font-medium">
                <Users2 className="h-3 w-3 text-gray-400" aria-hidden />
                {coupon.usedCount.toLocaleString()} Uses Today
              </span>
            )}
          </div>

          {/* CTA row — button sits on top of code box (overlapping) */}
          <div className="relative h-[46px]">
            {/* Code box: full width, sits behind button */}
            {codeHint && (
              <div className="absolute inset-0 flex items-center justify-end rounded-lg border-2 border-dashed border-gray-300 bg-white">
                <span className="pr-3 font-mono text-[12px] font-bold tracking-[0.22em] text-gray-400 select-none">
                  {codeHint}
                </span>
              </div>
            )}
            {/* Button: overlaps code from the left, consistent height always */}
            <a
              href={`/r/${coupon.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`absolute inset-y-0 left-0 z-10 flex items-center justify-center rounded-lg bg-cv-primary px-4 text-[13px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-cv-primary-strong ${codeHint ? "w-[80%]" : "w-full"}`}
            >
              {ctaText}
            </a>
          </div>

        </div>
      </div>
    </article>
  );
}
