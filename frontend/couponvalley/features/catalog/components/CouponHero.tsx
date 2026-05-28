import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { CheckCircle2, Sparkles, Users2 } from "lucide-react";
import { CouponCountdown } from "./CouponCountdown";
import type { CouponDetail } from "@/lib/api/types";

/**
 * Hero band for coupon detail pages. Crimson mesh background with the store
 * logo floating in a white card (shadow-lifted), title + glass meta chips
 * over the gradient, and a giant amber-gradient savings number on the right.
 * Server-rendered; image priority loaded so the headline is the LCP candidate.
 */
export function CouponHero({ coupon }: { coupon: CouponDetail }) {
  const savings = (coupon.savingsLabel ?? "").trim();
  const savingsBig = savings.replace(/\s*(off|back)\s*$/i, "").trim() || null;
  const savingsSuffix = savings.toLowerCase().endsWith("off")
    ? "OFF"
    : savings.toLowerCase().endsWith("back")
      ? "BACK"
      : null;

  return (
    <section
      aria-labelledby="coupon-hero-heading"
      className="cv-section-bg-mesh-primary relative overflow-hidden"
    >
      <div className="cv-container py-10 lg:py-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="flex items-start gap-4 lg:gap-5">
            {coupon.store && (
              <Link
                href={`/stores/${coupon.store.slug}`}
                className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-3 transition-transform hover:scale-[1.02] lg:h-24 lg:w-24"
                style={{ boxShadow: "var(--cv-shadow-lifted)" }}
                aria-label={`More from ${coupon.store.name}`}
              >
                {coupon.store.logoUrl ? (
                  <Image
                    src={coupon.store.logoUrl}
                    alt={coupon.store.name}
                    width={72}
                    height={72}
                    sizes="96px"
                    priority
                    className="max-h-full w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center rounded-xl bg-cv-primary text-2xl font-bold text-white">
                    {(coupon.store.name || "?").trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            )}
            <div className="min-w-0">
              {coupon.store && (
                <Link
                  href={`/stores/${coupon.store.slug}`}
                  className="font-display text-[12px] font-extrabold uppercase tracking-[0.16em] text-white/80 hover:text-white"
                >
                  {coupon.store.name}
                </Link>
              )}
              <h1
                id="coupon-hero-heading"
                className="cv-display-hero mt-1 text-white"
              >
                {coupon.title}
              </h1>
              <ul className="mt-4 flex flex-wrap items-center gap-2">
                {coupon.verified && (
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-display text-[12px] font-bold text-white backdrop-blur-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    Verified
                  </li>
                )}
                {coupon.exclusive && (
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-display text-[12px] font-bold text-white backdrop-blur-sm">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Exclusive
                  </li>
                )}
                {coupon.usedCount > 0 && (
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-display text-[12px] font-bold text-white backdrop-blur-sm">
                    <Users2 className="h-3.5 w-3.5" aria-hidden />
                    <span className="tabular-nums">
                      {coupon.usedCount.toLocaleString()}
                    </span>{" "}
                    uses
                  </li>
                )}
                <li className="ml-1">
                  <CouponCountdown
                    expiresAt={coupon.expiresAt}
                    variant="pills"
                  />
                </li>
              </ul>
            </div>
          </div>

          {savingsBig && (
            <div className="shrink-0 self-stretch">
              <div
                className="rounded-2xl bg-white px-6 py-5 text-center lg:px-8 lg:py-6"
                style={{ boxShadow: "var(--cv-shadow-lifted)" }}
              >
                <p className="cv-text-gradient-savings cv-savings-massive leading-none">
                  {savingsBig}
                </p>
                {savingsSuffix && (
                  <p className="mt-1 font-display text-[12px] font-extrabold uppercase tracking-[0.16em] text-cv-accent-700">
                    {savingsSuffix}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
