import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { HomepageSectionPayload, HomepageStats } from "@/lib/api/homepage";
import { formatCount } from "@/lib/format/number";
import { CouponFan } from "./CouponFan";
import { HeroSearch } from "./HeroSearch";
import { ProofCount } from "./ProofCount";

/**
 * Hero (spec block 1). Flat tint-50 band, left-aligned 7/5 grid. Admin copy
 * from the section row wins over the message defaults. H1 is the LCP
 * element: plain text, server-rendered, no image above it.
 */
export async function HeroSection({ section, stats }: { section: HomepageSectionPayload; stats: HomepageStats }) {
  const t = await getTranslations("home.hero");
  const title = section.title?.trim() || t("title");
  const subtitle = section.subtitle?.trim() || t("subtitle");
  const chips = section.categories ?? [];
  const fan = section.coupons ?? [];

  return (
    <section className="border-b border-clipupp-neutral-100 bg-clipupp-tint-50" aria-labelledby="hero-heading">
      <div className="clipupp-container grid items-center gap-12 py-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:py-20">
        <div>
          <span className="clipupp-fx text-[12px] font-medium uppercase tracking-[0.04em] text-clipupp-primary" style={{ "--i": 0 } as React.CSSProperties}>
            {t("eyebrow")}
          </span>
          <h1 id="hero-heading" className="clipupp-fx mt-3.5 max-w-[22ch] font-display text-[clamp(40px,5vw,60px)] font-semibold leading-[1.05] tracking-[-0.02em] text-clipupp-neutral-900" style={{ "--i": 1 } as React.CSSProperties}>
            {title}
          </h1>
          <p className="clipupp-fx mb-7 mt-4 max-w-[42ch] text-[18px] text-clipupp-neutral-700" style={{ "--i": 2 } as React.CSSProperties}>
            {subtitle}
          </p>
          <div className="clipupp-fx" style={{ "--i": 3 } as React.CSSProperties}>
            <HeroSearch placeholder={t("searchPlaceholder")} label={t("searchLabel")} cta={t("searchCta")} noResults={t("noResults", { q: "{q}" })} />
          </div>
          {chips.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Browse by category">
              {chips.map((c, i) => (
                <Link key={c.slug} href={`/categories/${c.slug}`}
                  className="clipupp-fx-chip inline-flex h-9 items-center rounded-full border border-clipupp-neutral-200 bg-white px-3.5 text-[14px] font-medium text-clipupp-neutral-900 transition-colors hover:border-clipupp-primary hover:text-clipupp-primary"
                  style={{ "--i": i } as React.CSSProperties}>
                  {c.title}
                </Link>
              ))}
            </div>
          )}
          <p className="clipupp-fx mt-7 flex items-center gap-2.5 text-[15px] font-medium text-clipupp-neutral-700 tabular-nums" style={{ "--i": 5 } as React.CSSProperties}>
            <span className="h-2 w-2 rounded-full bg-clipupp-success shadow-[0_0_0_4px_rgba(51,130,63,0.15)]" aria-hidden />
            <span>
              {t.rich("proof", {
                verified: () => <ProofCount to={stats.verifiedLast7d} />,
                stores: () => <b className="font-semibold text-clipupp-neutral-900">{formatCount(stats.activeStores)}</b>,
              })}
            </span>
          </p>
        </div>
        <CouponFan coupons={fan} />
      </div>
    </section>
  );
}
