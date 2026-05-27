import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { CheckCircle2, Clock, Sparkles, Users2 } from "lucide-react";
import type { CouponDetail } from "@/lib/api/types";

/**
 * Hero band for coupon detail pages. Store logo + name (linked), giant
 * savings label in primary blue, inline pill row (Verified · Used N times ·
 * Expires X · Exclusive). Server-rendered; image priority loaded.
 *
 * Anchors the page's hierarchy before the reveal card so users immediately
 * see "what this is, who it's from, when it expires."
 */
export function CouponHero({ coupon }: { coupon: CouponDetail }) {
  const savings = (coupon.savingsLabel ?? "").trim();
  const savingsBig = savings.replace(/\s*(off|back)\s*$/i, "").trim() || null;
  const expiresLabel = formatExpiry(coupon.expiresAt);

  return (
    <section
      aria-labelledby="coupon-hero-heading"
      className="border-b border-cv-neutral-200 bg-white"
    >
      <div className="cv-container py-8 lg:py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex items-start gap-4">
            {coupon.store && (
              <Link
                href={`/stores/${coupon.store.slug}`}
                className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-cv-neutral-200 bg-white p-2 transition-colors hover:border-cv-primary lg:h-20 lg:w-20"
                aria-label={`More from ${coupon.store.name}`}
              >
                {coupon.store.logoUrl ? (
                  <Image
                    src={coupon.store.logoUrl}
                    alt={coupon.store.name}
                    width={64}
                    height={64}
                    sizes="80px"
                    priority
                    className="max-h-full w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center rounded-md bg-cv-primary text-xl font-bold text-white">
                    {(coupon.store.name || "?").trim().charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            )}
            <div className="min-w-0">
              {coupon.store && (
                <Link
                  href={`/stores/${coupon.store.slug}`}
                  className="text-[13px] font-semibold uppercase tracking-[0.04em] text-cv-neutral-500 hover:text-cv-primary"
                >
                  {coupon.store.name}
                </Link>
              )}
              <h1
                id="coupon-hero-heading"
                className="mt-1 font-display text-[1.5rem] font-bold leading-tight tracking-tight text-cv-neutral-900 lg:text-[2rem]"
              >
                {coupon.title}
              </h1>
              <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
                {coupon.verified && (
                  <li className="inline-flex items-center gap-1 font-medium text-cv-success-strong">
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> Verified
                  </li>
                )}
                {coupon.exclusive && (
                  <li className="inline-flex items-center gap-1 font-medium text-cv-accent-strong">
                    <Sparkles className="h-4 w-4" aria-hidden /> Exclusive
                  </li>
                )}
                {coupon.usedCount > 0 && (
                  <li className="inline-flex items-center gap-1 text-cv-neutral-500">
                    <Users2 className="h-4 w-4" aria-hidden />
                    <span className="font-medium tabular-nums text-cv-neutral-900">
                      {coupon.usedCount.toLocaleString()}
                    </span>{" "}
                    uses
                  </li>
                )}
                {expiresLabel && (
                  <li className="inline-flex items-center gap-1 text-cv-neutral-500">
                    <Clock className="h-4 w-4" aria-hidden /> {expiresLabel}
                  </li>
                )}
              </ul>
            </div>
          </div>

          {savingsBig && (
            <div className="shrink-0">
              <p className="font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight tabular-nums text-cv-primary lg:text-[3rem]">
                {savingsBig}
                {savings.toLowerCase().endsWith("off") && (
                  <span className="ml-1 text-[1rem] font-semibold uppercase tracking-[0.04em] text-cv-neutral-500">
                    off
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function formatExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  const now = Date.now();
  const ms = dt.getTime() - now;
  if (ms < 0) return "Expired";
  const days = Math.round(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  if (days <= 30) return `Expires in ${days} days`;
  return `Expires ${dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
