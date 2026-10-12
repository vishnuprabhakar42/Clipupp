import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { HomepageSectionPayload } from "@/lib/api/homepage";
import type { HomeFeed } from "@/lib/home/feed";
import { toSearchFeed } from "@/lib/home/searchFeed";
import { HeaderSearch } from "@/features/catalog/components/HeaderSearch";
import { SpotlightCarousel } from "./SpotlightCarousel";

const fx = (i: number) => ({ "--i": i }) as CSSProperties;
// The v2 migration seeded these into the hero row; they are not admin edits.
const LEGACY_TITLE = "Working coupon codes for every Indian store.";
const LEGACY_SUBTITLE = "No wallet, no tracking, no waiting. Just codes that work.";
const fmt = (n: number) => n.toLocaleString("en-IN");

/**
 * Hero (v3). Tint band with a corner glow; copy on the left, spotlight
 * carousel on the right at lg+. The H1 is the LCP element: plain server text
 * whose entrance animates transform only (clipupp-fx-lcp). Admin copy from
 * the section row wins over the message defaults. Numbers are rendered final
 * (no count-up) so there is no hydration jump.
 */
export async function HeroSection({
  feed,
  section,
}: {
  feed: HomeFeed;
  section: Pick<HomepageSectionPayload, "title" | "subtitle">;
}) {
  const t = await getTranslations("home.hero");
  const rawTitle = section.title?.trim();
  const rawSub = section.subtitle?.trim();
  const title = rawTitle && rawTitle !== LEGACY_TITLE ? rawTitle : "";
  const subtitle = rawSub && rawSub !== LEGACY_SUBTITLE ? rawSub : t("subtitle");
  const popular = feed.stores
    .filter((s) => s.popular != null && s.popular <= 6)
    .sort((a, b) => (a.popular ?? 0) - (b.popular ?? 0));
  const { stats } = feed;
  const cell =
    "rounded-[14px] border border-clipupp-neutral-200 bg-clipupp-surface p-3 lg:flex lg:items-baseline lg:gap-1.5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0";
  const num = "clipupp-num block text-[20px] font-bold leading-tight text-clipupp-neutral-900 lg:inline lg:text-[16px]";
  const lab = "mt-0.5 block text-[12px] leading-snug text-clipupp-neutral-600 lg:mt-0 lg:inline lg:text-[15px]";

  return (
    <section
      aria-labelledby="hero-heading"
      className="border-b border-clipupp-neutral-100"
      style={{ background: "radial-gradient(900px 300px at 90% -20%, var(--clipupp-tint-200), transparent), var(--clipupp-tint-50)" }}
    >
      <div className="clipupp-container grid items-center gap-7 py-6 sm:py-[52px] lg:grid-cols-[6fr_5fr] lg:gap-14 lg:py-14">
        <div className="min-w-0">
          <p className="clipupp-fx text-[12px] font-semibold uppercase tracking-[0.07em] text-clipupp-primary" style={fx(0)}>
            {t("eyebrow")}
          </p>
          <h1
            id="hero-heading"
            className="clipupp-fx-lcp mt-2.5 max-w-[17ch] sm:max-w-none font-display text-[28px] font-bold leading-[1.08] tracking-[-0.01em] text-clipupp-neutral-900 [text-wrap:balance] sm:text-[40px] lg:mt-3.5 lg:text-[56px]"
            style={fx(1)}
          >
            {title ||
              t.rich("title", {
                em: (chunks) => <em className="not-italic text-clipupp-primary">{chunks}</em>,
              })}
          </h1>
          <p className="clipupp-fx mt-3.5 max-w-[46ch] text-[15px] leading-[1.55] text-clipupp-neutral-700 lg:text-[18px]" style={fx(2)}>
            {subtitle}
          </p>
          <div className="clipupp-fx mt-7 hidden max-w-[560px] lg:block" style={fx(3)}>
            <HeaderSearch variant="hero" feed={toSearchFeed(feed)} placeholder={t("searchPlaceholder")} ctaLabel={t("searchCta")} />
          </div>
          <div
            role="group"
            aria-label={t("trustAria")}
            className="clipupp-fx mt-5 grid grid-cols-3 gap-2.5 lg:mt-6 lg:flex lg:flex-wrap lg:items-center lg:gap-x-5 lg:gap-y-2"
            style={fx(4)}
          >
            <div className={cell}>
              <span className="flex items-center gap-2 lg:contents">
                <span className="h-2 w-2 shrink-0 rounded-full bg-clipupp-success shadow-[0_0_0_4px_rgb(var(--clipupp-success-rgb)/0.18)]" aria-hidden />
                <b className={num + " !inline lg:!inline lg:ml-1"}>{fmt(stats.verifiedToday)}</b>
              </span>
              <span className={lab}>{t("verifiedToday")}</span>
            </div>
            {stats.successRate7d != null ? (
              <div className={cell}>
                <b className={num}>{stats.successRate7d}%</b>
                <span className={lab}>{t("worked7d")}</span>
              </div>
            ) : (
              <div className={cell}>
                <b className={num}>{fmt(stats.activeCoupons)}</b>
                <span className={lab}>{t("activeCoupons")}</span>
              </div>
            )}
            <div className={cell}>
              <b className={num}>{fmt(stats.storeCount)}+</b>
              <span className={lab}>{t("stores")}</span>
            </div>
          </div>
          {popular.length > 0 && (
            <div
              className="clipupp-fx clipupp-no-scrollbar -mx-4 mt-5 flex items-center gap-2.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-6 lg:flex-wrap lg:overflow-visible lg:px-0"
              style={fx(5)}
            >
              <span className="shrink-0 text-[14px] text-clipupp-neutral-600">{t("popular")}</span>
              {popular.map((s) => (
                <Link
                  key={s.id}
                  href={`/stores/${s.id}`}
                  className="inline-flex h-9 shrink-0 items-center rounded-full border border-clipupp-neutral-200 bg-clipupp-surface px-4 text-[15px] font-medium text-clipupp-neutral-900 transition-colors hover:border-clipupp-primary hover:text-clipupp-primary"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        <SpotlightCarousel slides={feed.spotlight} stores={feed.stores} coupons={feed.coupons} />
      </div>
    </section>
  );
}
