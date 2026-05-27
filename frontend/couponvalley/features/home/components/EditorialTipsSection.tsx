import { BadgeCheck, Layers, ShieldCheck, TrendingUp } from "lucide-react";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Editorial "how to save" content — three educational tiles. Server-
 * rendered with zero data fetches, fully static HTML. Doubles as
 * keyword-rich content for SEO around savings-related queries.
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
    title: string;
    body: string;
  }> = [
    {
      icon: Layers,
      title: "Stack codes the right way",
      body: "Most stores let you combine a promo code with site-wide sales at checkout. Try the highest-value code first, then layer free shipping or member discounts on top.",
    },
    {
      icon: TrendingUp,
      title: "Time your purchases",
      body: "End-of-season sales and major retail events (Diwali, Republic Day, Black Friday) routinely unlock 30 – 50% extra. Watchlist a deal — we'll alert you when a better one drops.",
    },
    {
      icon: ShieldCheck,
      title: "Always verify before checkout",
      body: "Every code in our database is retested every 24 hours. Look for the verified badge and the last-tested timestamp before pasting at the merchant.",
    },
    {
      icon: BadgeCheck,
      title: "Save deals for later",
      body: "Bookmark coupons you can't use today. We'll send a single reminder email before each one expires — no spam, no marketing follow-ups.",
    },
  ];

  return (
    <section aria-labelledby="tips-heading">
      <div className="mb-8 max-w-2xl">
        <p className="cv-tag bg-transparent px-0 text-cv-primary">Editorial guides</p>
        <h2 id="tips-heading" className="cv-h2 mt-2">
          {heading}
        </h2>
        <p className="cv-body mt-2 text-cv-neutral-600">{subtitle}</p>
      </div>
      <ul className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {tips.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="flex h-full flex-col gap-3 rounded-lg border border-cv-neutral-200 bg-white p-6 shadow-card"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-cv-primary-soft">
              <Icon className="h-5 w-5 text-cv-primary" aria-hidden />
            </span>
            <h3 className="cv-h3">{title}</h3>
            <p className="cv-body text-cv-neutral-600">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
