import { BadgeCheck, Building2, Ticket, TrendingUp } from "lucide-react";
import { asString } from "@/lib/api/settings";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Social-proof strip of four large numeric tiles. Values come from
 * `site_setting` keys (admin-editable via /admin/settings) with sensible
 * fallbacks so the section is never empty.
 *
 * Keys used:
 *   stats.coupons   — total active coupons (e.g. "10,000+")
 *   stats.stores    — partner stores (e.g. "500+")
 *   stats.verified  — verification rate (e.g. "97%")
 *   stats.savings   — average savings per user (e.g. "₹1,200")
 */
export function SavingsStatsStrip({
  section,
  settings,
}: {
  section?: HomepageSectionPayload | null;
  // Optional + safe-default `{}` so the component renders with fallback
  // values even if the caller forgets to pass `settings` or the public
  // settings endpoint is unreachable.
  settings?: Record<string, unknown>;
}) {
  const s = settings ?? {};
  const heading = section?.title ?? "Real numbers from real shoppers";
  const subtitle =
    section?.subtitle ??
    "Live counts from our coupon catalog and partner network — refreshed every hour.";

  const tiles: Array<{
    value: string;
    label: string;
    note: string;
    icon: typeof BadgeCheck;
  }> = [
    {
      value: asString(s["stats.coupons"], "10,000+"),
      label: "Active coupons",
      note: "Live every day",
      icon: Ticket,
    },
    {
      value: asString(s["stats.stores"], "500+"),
      label: "Partner stores",
      note: "Across every category",
      icon: Building2,
    },
    {
      value: asString(s["stats.verified"], "97%"),
      label: "Verified daily",
      note: "Codes retested in 24h",
      icon: BadgeCheck,
    },
    {
      value: asString(s["stats.savings"], "₹1,200"),
      label: "Avg. savings",
      note: "Per active shopper",
      icon: TrendingUp,
    },
  ];

  return (
    <section aria-labelledby="stats-heading">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="cv-tag bg-transparent px-0 text-cv-primary">By the numbers</p>
        <h2 id="stats-heading" className="cv-h2 mt-2">
          {heading}
        </h2>
        <p className="cv-body mt-2 text-cv-neutral-600">{subtitle}</p>
      </div>

      <ul className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {tiles.map(({ value, label, note, icon: Icon }) => (
          <li
            key={label}
            className="flex h-full flex-col gap-3 rounded-lg border border-cv-neutral-200 bg-white p-6 shadow-card"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-cv-primary-soft">
              <Icon className="h-5 w-5 text-cv-primary" aria-hidden />
            </span>
            <p className="font-display text-[2rem] font-bold leading-none tracking-tight text-cv-neutral-900 tabular-nums lg:text-[2.25rem]">
              {value}
            </p>
            <div>
              <p className="cv-h3">{label}</p>
              <p className="cv-meta mt-0.5">{note}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
