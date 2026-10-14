import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { HomepageSectionPayload } from "@/lib/api/homepage";
import type { HomeFeed } from "@/lib/home/feed";
import { displayShortName } from "@/lib/home/storeName";
import { toSearchFeed } from "@/lib/home/searchFeed";
import { proofStat } from "@/lib/home/proofStat";
import { HeaderSearch } from "@/features/catalog/components/HeaderSearch";
import { HeroChipStrip } from "./HeroChipStrip";
import { SpotlightCarousel } from "./SpotlightCarousel";

const fx = (i: number) => ({ "--i": i }) as CSSProperties;
// The v2 migration seeded these into the hero row; they are not admin edits.
const LEGACY_TITLE = "Working coupon codes for every Indian store.";
const LEGACY_SUBTITLE = "No wallet, no tracking, no waiting. Just codes that work.";
const fmt = (n: number) => n.toLocaleString("en-IN");

/**
 * Hero (v3). Tint band with a corner glow; copy on the left, spotlight
 * carousel on the right from md (44%), stacked below md. The H1 is the LCP
 * element: plain server text whose entrance animates transform only
 * (clipupp-fx-lcp), sized by the fluid --fs-h1 token. Admin copy from
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
    .sort((a, b) => (a.popular ?? 0) - (b.popular ?? 0))
    .slice(0, 6);
  const { stats } = feed;
  // Proof first: a verified count (today, else this week) with the live dot,
  // else active coupons; never a zero. The success rate or the active count
  // fills the middle cell unless the proof already used it.
  const proof = proofStat(stats);
  const cells: { key: string; value: string; label: string; dot?: boolean }[] = [];
  if (proof && proof.kind !== "active")
    cells.push({ key: "proof", value: fmt(proof.value), label: t(proof.kind === "today" ? "verifiedToday" : "verifiedWeek"), dot: true });
  if (stats.successRate7d != null) cells.push({ key: "rate", value: `${stats.successRate7d}%`, label: t("worked7d") });
  else if (stats.activeCoupons > 0) cells.push({ key: "active", value: fmt(stats.activeCoupons), label: t("activeCoupons") });
  if (stats.storeCount > 0) cells.push({ key: "stores", value: `${fmt(stats.storeCount)}+`, label: t("stores") });
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
      <div className="clipupp-container grid items-center gap-7 pb-3 pt-6 sm:py-[52px] md:grid-cols-[minmax(0,1fr)_44%] md:gap-10 lg:grid-cols-[6fr_5fr] lg:gap-14 lg:py-14">
        <div className="min-w-0">
          <p className="clipupp-fx text-[11.5px] font-semibold uppercase tracking-[0.07em] text-clipupp-primary" style={fx(0)}>
            {t("eyebrow")}
          </p>
          <h1
            id="hero-heading"
            className="clipupp-fx-lcp mt-2.5 max-w-[17ch] sm:max-w-none font-display text-[length:var(--fs-h1)] font-bold leading-[1.08] tracking-[-0.01em] text-clipupp-neutral-900 [text-wrap:balance] lg:mt-3.5"
            style={fx(1)}
          >
            {title ||
              t.rich("title", {
                em: (chunks) => <em className="not-italic text-clipupp-primary">{chunks}</em>,
              })}
          </h1>
          <p className="clipupp-fx mt-3.5 max-w-[46ch] text-[length:var(--fs-lead)] leading-[1.55] text-clipupp-neutral-700" style={fx(2)}>
            {subtitle}
          </p>
          {/* Own layer above the later fx siblings (each is a stacking context) so the suggestion panel is not painted under them. */}
          <div className="clipupp-fx relative z-dropdown mt-6 hidden max-w-[560px] lg:block" style={fx(3)}>
            <HeaderSearch
              variant="hero"
              feed={toSearchFeed(feed)}
              placeholder={t("searchPlaceholder")}
              ctaLabel={t("searchCta")}
              aria-label={t("searchAria")}
            />
          </div>
          {cells.length > 0 && (
            <div
              role="group"
              aria-label={t("trustAria")}
              className={`clipupp-fx mt-5 grid ${cells.length === 3 ? "grid-cols-3" : "grid-cols-2"} gap-2.5 lg:flex lg:flex-wrap lg:items-center lg:gap-x-5 lg:gap-y-2`}
              style={fx(4)}
            >
              {cells.map((c) => (
                <div key={c.key} className={cell}>
                  {c.dot ? (
                    <span className="flex items-center gap-2 lg:contents">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-clipupp-success shadow-[0_0_0_4px_rgb(var(--clipupp-success-rgb)/0.18)]" aria-hidden />
                      <b className={num + " !inline lg:!inline lg:ml-1"}>{c.value}</b>
                    </span>
                  ) : (
                    <b className={num}>{c.value}</b>
                  )}
                  <span className={lab}>{c.label}</span>
                </div>
              ))}
            </div>
          )}
          {popular.length > 0 && (
            <HeroChipStrip
              ariaLabel={t("popularAria")}
              className="clipupp-fx -mx-4 mt-5 sm:-mx-6 md:mx-0 lg:mt-4"
              style={fx(5)}
            >
              <span className="shrink-0 text-[14px] text-clipupp-neutral-600">{t("popular")}</span>
              {popular.map((s) => (
                <Link
                  key={s.id}
                  href={`/stores/${s.id}`}
                  className="inline-flex h-9 shrink-0 items-center rounded-full border border-clipupp-neutral-200 bg-clipupp-surface px-3.5 text-[15px] font-medium text-clipupp-neutral-900 clipupp-press hover:border-clipupp-primary hover:text-clipupp-primary"
                >
                  {displayShortName(s.name)}
                </Link>
              ))}
            </HeroChipStrip>
          )}
        </div>
        <SpotlightCarousel slides={feed.spotlight} stores={feed.stores} coupons={feed.coupons} />
      </div>
    </section>
  );
}
