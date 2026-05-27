import { BadgeCheck, Sparkles, ShieldCheck, Wallet } from "lucide-react";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Value-proposition strip — four side-by-side guarantees that build trust
 * before the FAQ + newsletter signup. Different layout from the stats
 * strip: icon + text inline, no big numeric values.
 */
export function GuaranteeStrip({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Why shoppers choose CouponValley";

  const items: Array<{
    icon: typeof BadgeCheck;
    label: string;
    body: string;
  }> = [
    {
      icon: BadgeCheck,
      label: "Verified daily",
      body: "Every code is re-tested every 24 hours.",
    },
    {
      icon: Wallet,
      label: "Always free",
      body: "No subscription, no hidden fees, ever.",
    },
    {
      icon: ShieldCheck,
      label: "Spam-free promise",
      body: "We never share your email with merchants.",
    },
    {
      icon: Sparkles,
      label: "Editor curated",
      body: "Hand-picked deals, never auto-imported.",
    },
  ];

  return (
    <section aria-labelledby="guarantees-heading">
      <h2 id="guarantees-heading" className="sr-only">
        {heading}
      </h2>
      <ul className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {items.map(({ icon: Icon, label, body }) => (
          <li
            key={label}
            className="flex h-full items-start gap-3 rounded-lg border border-cv-neutral-200 bg-white p-5 shadow-card"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-cv-primary-soft">
              <Icon className="h-5 w-5 text-cv-primary" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="cv-h3">{label}</p>
              <p className="cv-meta mt-1 leading-relaxed">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
