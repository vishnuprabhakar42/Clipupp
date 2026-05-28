import { BadgeCheck, Sparkles, ShieldCheck, Wallet } from "lucide-react";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Value-proposition strip — four side-by-side guarantees that build trust
 * before the FAQ + newsletter signup. Each tile gets a left-edge gradient
 * bar that widens on hover (clipupp-edge-bar) + a soft icon disc.
 */
export function GuaranteeStrip({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Why shoppers choose Clipupp";

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
            className="clipupp-card clipupp-edge-bar group flex h-full items-start gap-3 p-5"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-clipupp-primary-soft text-clipupp-primary">
              <Icon className="h-5 w-5" aria-hidden strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="clipupp-h3">{label}</p>
              <p className="clipupp-meta mt-1 leading-relaxed">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
