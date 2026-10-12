import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { HomepageSectionPayload } from "@/lib/api/homepage";
import { SectionHeader } from "./SectionHeader";

function dateRange(startsAt: string, endsAt: string): string {
  const f = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
  return `${f.format(new Date(startsAt))} to ${f.format(new Date(endsAt))}`;
}

/**
 * Block 5: two campaign tiles side by side plus a bank chip row. Returns
 * null when there are no active campaigns so the page shows no empty band.
 * Campaign CTA falls back to the campaign page.
 */
export async function BankOffersHub({ section, banks }: { section: HomepageSectionPayload; banks: string[] }) {
  const t = await getTranslations("home.bank");
  const campaigns = (section.campaigns ?? []).slice(0, 2);
  if (campaigns.length === 0) return null;
  return (
    <section className="clipupp-container pb-12 lg:pb-24" aria-labelledby="bank-heading" id="bank">
      <SectionHeader eyebrow={section.subtitle ?? t("eyebrow")} title={section.title} />
      <div className="grid gap-6 md:grid-cols-2">
        {campaigns.map((c, i) => {
          const href = c.ctaUrl?.trim() || `/campaigns/${c.slug}`;
          const external = /^https?:\/\//.test(href);
          const label = c.ctaLabel?.trim() || t("defaultCta");
          return (
            <article key={c.id} className="clipupp-reveal flex min-h-[200px] flex-col gap-3 rounded-xl border border-clipupp-neutral-200 bg-white p-8" style={{ "--i": i } as React.CSSProperties}>
              <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-clipupp-primary">{c.name} · {dateRange(c.startsAt, c.endsAt)}</span>
              <h3 className="max-w-[22ch] font-display text-[26px] font-semibold leading-[1.2] text-clipupp-neutral-900">{c.heroTitle?.trim() || c.name}</h3>
              {c.heroSubtitle && <p className="text-clipupp-neutral-700">{c.heroSubtitle}</p>}
              {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="mt-auto text-[15px] font-medium text-clipupp-primary hover:underline">{label} →</a>
              ) : (
                <Link href={href} className="mt-auto text-[15px] font-medium text-clipupp-primary hover:underline">{label} →</Link>
              )}
            </article>
          );
        })}
      </div>
      {banks.length > 0 && (
        <ul className="clipupp-reveal mt-5 flex flex-wrap gap-2" aria-label="Participating banks">
          {banks.map((b) => (
            <li key={b} className="inline-flex h-[34px] items-center rounded-full border border-clipupp-neutral-200 bg-white px-3.5 text-[13px] font-medium text-clipupp-neutral-900">{b}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
