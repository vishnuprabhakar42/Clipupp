import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/lib/seo/jsonLd";
import type { HomeFeed } from "@/lib/home/feed";

/** FAQ accordion (native details, first open) with server-rendered FAQPage JSON-LD. */
export async function FaqSection({ feed }: { feed: HomeFeed }) {
  const t = await getTranslations("home.faq");
  if (feed.faq.length === 0) return null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: feed.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section id="faq" aria-labelledby="faq-heading" className="clipupp-container grid gap-8 pt-8 sm:pt-12 md:grid-cols-[4fr_7fr] md:gap-12 lg:gap-16 lg:pt-16">
      <JsonLd data={ld} />
      <div className="clipupp-reveal">
        <span className="mb-1.5 block text-[11.5px] font-semibold uppercase leading-[1.5] tracking-[0.07em] text-clipupp-primary">{t("eyebrow")}</span>
        <h2 id="faq-heading" className="text-balance font-display text-[length:var(--fs-h2)] font-semibold leading-[1.15] tracking-[-0.01em] text-clipupp-neutral-900">{t("title")}</h2>
        {feed.supportEmail && <p className="mt-2 max-w-[40ch] text-[14.5px] leading-normal text-clipupp-neutral-600">{t("stuck", { email: feed.supportEmail })}</p>}
      </div>
      <div className="clipupp-reveal border-b border-clipupp-neutral-200" style={{ "--i": 1 } as React.CSSProperties}>
        {feed.faq.map((f, i) => (
          <details key={f.q} open={i === 0} className="group border-t border-clipupp-neutral-200 first:border-t-0">
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[15.5px] font-semibold text-clipupp-neutral-900 marker:hidden [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-clipupp-neutral-500 transition-transform duration-200 group-open:rotate-45 group-open:text-clipupp-primary motion-reduce:transition-none">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p className="max-w-[62ch] pb-4 pr-8 text-[14.5px] leading-normal text-clipupp-neutral-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
