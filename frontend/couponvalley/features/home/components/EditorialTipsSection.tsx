import { BadgeCheck, Layers, ShieldCheck, TrendingUp } from "lucide-react";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Editorial "how to save" content — four educational tiles. Server-rendered
 * with zero data fetches, fully static HTML. Doubles as keyword-rich content
 * for SEO around savings-related queries.
 *
 * Visual tier (Phase 2): sits on `cv-section-bg-success-soft` (mint band).
 * Each tile gets a numbered gradient disc (01..04) instead of an icon —
 * the eyebrow contains the icon, the disc carries the order.
 */
export function EditorialTipsSection({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Smart ways to save more on every order";
  const subtitle =
    section?.subtitle ??
    "Tactics from our editorial team for stretching every rupee further — without the work.";

  const tips: Array<{
    icon: typeof Layers;
    number: string;
    title: string;
    body: string;
  }> = [
    {
      icon: Layers,
      number: "01",
      title: "Stack codes the right way",
      body: "Most stores let you combine a promo code with site-wide sales at checkout. Try the highest-value code first, then layer free shipping or member discounts on top.",
    },
    {
      icon: TrendingUp,
      number: "02",
      title: "Time your purchases",
      body: "End-of-season sales and major retail events (Diwali, Republic Day, Black Friday) routinely unlock 30 – 50% extra. Watchlist a deal — we'll alert you when a better one drops.",
    },
    {
      icon: ShieldCheck,
      number: "03",
      title: "Always verify before checkout",
      body: "Every code in our database is retested every 24 hours. Look for the verified badge and the last-tested timestamp before pasting at the merchant.",
    },
    {
      icon: BadgeCheck,
      number: "04",
      title: "Save deals for later",
      body: "Bookmark coupons you can't use today. We'll send a single reminder email before each one expires — no spam, no marketing follow-ups.",
    },
  ];

  // 4-color rotating gradient discs.
  const DISCS = [
    { bg: "cv-gradient-hero", glow: "shadow-glow-primary" },
    { bg: "cv-gradient-warm", glow: "shadow-glow-accent" },
    { bg: "cv-gradient-success", glow: "shadow-glow-success" },
    { bg: "cv-gradient-cool", glow: "shadow-glow-primary" },
  ];

  return (
    <section aria-labelledby="tips-heading">
      <div className="mb-9 max-w-2xl">
        <p className="cv-eyebrow-vivid cv-eyebrow-vivid--success">
          Editorial guides
        </p>
        <h2 id="tips-heading" className="cv-h2 mt-3">
          {heading}
        </h2>
        <p className="cv-body mt-3 text-cv-neutral-700">{subtitle}</p>
      </div>
      <ul className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {tips.map(({ icon: Icon, number, title, body }, i) => {
          const disc = DISCS[i % DISCS.length];
          return (
            <li key={title} className="cv-card flex h-full flex-col gap-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl text-white font-display text-[15px] font-extrabold ${disc.bg} ${disc.glow}`}
                  aria-hidden
                >
                  {number}
                </span>
                <Icon
                  className="h-6 w-6 text-cv-neutral-300"
                  aria-hidden
                  strokeWidth={1.75}
                />
              </div>
              <h3 className="cv-h3">{title}</h3>
              <p className="cv-body text-cv-neutral-700">{body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
