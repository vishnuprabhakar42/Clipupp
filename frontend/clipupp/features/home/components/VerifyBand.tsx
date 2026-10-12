import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Block 6: the one tint-filled block of its viewport. Three left-aligned text
 * columns with bold lead lines, no icon grid, one secondary button.
 */
export async function VerifyBand({ section }: { section: HomepageSectionPayload }) {
  const t = await getTranslations("home.verify");
  const cols = [1, 2, 3] as const;
  return (
    <section className="bg-clipupp-tint-100" aria-labelledby="verify-heading" id="verify">
      <div className="clipupp-container py-14 lg:py-[88px]">
        {section.subtitle && <span className="clipupp-reveal text-[12px] font-medium uppercase tracking-[0.04em] text-clipupp-primary">{section.subtitle}</span>}
        <h2 id="verify-heading" className="clipupp-reveal max-w-[24ch] font-display text-[clamp(28px,3vw,32px)] font-semibold leading-[1.15] tracking-[-0.02em] text-clipupp-neutral-900" style={{ "--i": 1 } as React.CSSProperties}>
          {section.title}
        </h2>
        <div className="my-9 grid gap-8 md:grid-cols-3">
          {cols.map((n, i) => (
            <div key={n} className="clipupp-reveal" style={{ "--i": i } as React.CSSProperties}>
              <b className="mb-1.5 block text-[17px] font-semibold text-clipupp-neutral-900">{t(`col${n}Title`)}</b>
              <p className="text-clipupp-neutral-700">{t(`col${n}Body`)}</p>
            </div>
          ))}
        </div>
        <Link href="/coupons" className="clipupp-reveal inline-flex h-11 items-center rounded-full border border-clipupp-primary px-5 text-[15px] font-medium text-clipupp-primary transition-colors hover:bg-white" style={{ "--i": 3 } as React.CSSProperties}>
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
