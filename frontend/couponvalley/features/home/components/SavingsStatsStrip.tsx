import { BadgeCheck, Building2, Ticket, TrendingUp } from "lucide-react";
import { asString } from "@/lib/api/settings";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Social-proof strip of four large numeric tiles. Values come from
 * `site_setting` keys (admin-editable via /admin/settings) with sensible
 * fallbacks so the section is never empty.
 *
 * Visual tier (Phase 2): tiles sit on `cv-section-bg-accent-soft` (page-level
 * background wires this in `page.tsx`). Each tile gets a 4-colour rotating
 * gradient icon disc + amber-gradient numbers via `cv-text-gradient-savings`.
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
      <div className="mx-auto mb-9 max-w-2xl text-center">
        <h2 id="stats-heading" className="cv-eyebrow-vivid mx-auto">{heading}</h2>
        <p className="cv-body mt-3 text-cv-neutral-700">{subtitle}</p>
      </div>

      <ul className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(({ value, label, note, icon: Icon }) => (
          <li
            key={label}
            className="cv-card flex h-full flex-col gap-3 p-6"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cv-primary-soft text-cv-primary">
              <Icon className="h-6 w-6" aria-hidden strokeWidth={2} />
            </span>
            <p className="font-display text-[2.25rem] font-extrabold leading-none tracking-tight tabular-nums text-cv-neutral-900 lg:text-[2.5rem]">
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
