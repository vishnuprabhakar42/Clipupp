import { ChevronDown } from "lucide-react";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Frequently asked questions — server-rendered native `<details>` accordion
 * so every Q&A pair is in the initial HTML for SEO. Pairs are also emitted
 * as JSON-LD `FAQPage` structured data, which Google may surface as a
 * collapsible FAQ rich result in search.
 *
 * Visual tier (Phase 2): sits on `clipupp-section-bg-primary-soft`. Each accordion
 * item gets a gradient chevron disc that flips on open.
 *
 * No client-side JavaScript — opening/closing is handled by the browser's
 * native `<details>` element. Smooth chevron rotation via `group-open:`.
 */
const FAQS: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "Are all Clipupp coupons free to use?",
    a: "Yes. Every coupon, deal, and discount on Clipupp is free for shoppers — no subscription, no membership, no premium tier. We earn a small affiliate commission when you click through and buy, which costs you nothing extra and funds our verification team.",
  },
  {
    q: "How do I know a code actually works at checkout?",
    a: "Each code on Clipupp is retested every 24 hours by our editorial team plus an automated checker. Codes with a green verified badge passed within the last week. The last-tested timestamp on every coupon page tells you exactly when the code was confirmed live.",
  },
  {
    q: "What if a code fails when I try it?",
    a: "Tap the \"Report broken\" button on the coupon page. Reports are reviewed within a few hours, and broken codes are removed or flagged so the next shopper isn't disappointed. The top alternative deal from the same store is suggested automatically.",
  },
  {
    q: "Can I save coupons to use later?",
    a: "Yes — create a free account and tap the bookmark icon on any coupon. Saved coupons live in your account dashboard, and we send a single reminder email before each one expires so nothing slips through the cracks.",
  },
  {
    q: "Do you cover Indian stores or only international brands?",
    a: "Both. Clipupp partners with hundreds of Indian-first brands across fashion, electronics, travel, food, and finance, plus the global retailers that ship to India. Use the category strip at the top to filter by what matters to you.",
  },
  {
    q: "How can I submit a coupon I found elsewhere?",
    a: "Every store page has a \"Submit a deal\" link near the top. User submissions go through the same 24-hour verification as our editorial finds — if it works, it's published with credit; if it doesn't, we let you know why.",
  },
  {
    q: "Does Clipupp work on mobile?",
    a: "The full site works on any modern mobile browser — no app required. Every coupon code is one tap to copy, and the bottom navigation keeps Home, Browse, Saved, and Account always within thumb reach.",
  },
];

export function FaqSection({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Frequently asked questions";
  const subtitle =
    section?.subtitle ??
    "Everything you need to know about saving with Clipupp. Still stuck? Drop us a line — humans answer.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <section aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl">
        <div className="mb-9 text-center">
          <h2 id="faq-heading" className="clipupp-eyebrow-vivid mx-auto">
            {heading}
          </h2>
          <p className="clipupp-body mx-auto mt-3 max-w-xl text-clipupp-neutral-700">
            {subtitle}
          </p>
        </div>

        <ul className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <li key={i}>
              <details className="clipupp-card group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
                  <h3 className="clipupp-h3 text-left">{q}</h3>
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-clipupp-primary-soft text-clipupp-primary transition-transform group-open:rotate-180"
                    aria-hidden
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </summary>
                <p className="clipupp-body border-t border-clipupp-neutral-200 px-5 py-4 leading-relaxed text-clipupp-neutral-700">
                  {a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
