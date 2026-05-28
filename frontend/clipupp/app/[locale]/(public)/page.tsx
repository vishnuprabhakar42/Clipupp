import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { HowItWorksSection } from "@/features/home/components/HowItWorksSection";
import { TrendingStoresRail } from "@/features/home/components/TrendingStoresRail";
import { PromoBannersCarousel } from "@/features/home/components/PromoBannersCarousel";
import { FeaturedStoresGrid } from "@/features/home/components/FeaturedStoresGrid";
import { TopDealsSection } from "@/features/home/components/TopDealsSection";
import { BlogSection } from "@/features/home/components/BlogSection";
import { PopularCategoriesGrid } from "@/features/home/components/PopularCategoriesGrid";
import { NewsletterBar } from "@/features/home/components/NewsletterBar";
import { TrustedBrandsRail } from "@/features/home/components/TrustedBrandsRail";
import { HeroSearchSection } from "@/features/home/components/HeroSearchSection";
import { SavingsStatsStrip } from "@/features/home/components/SavingsStatsStrip";
import { DailyPicksSection } from "@/features/home/components/DailyPicksSection";
import { EditorialTipsSection } from "@/features/home/components/EditorialTipsSection";
import { GuaranteeStrip } from "@/features/home/components/GuaranteeStrip";
import { FaqSection } from "@/features/home/components/FaqSection";
import { homepageApi, type HomepageSectionPayload } from "@/lib/api/homepage";
import { getPublicSettings, asString } from "@/lib/api/settings";
import { getServerSession } from "@/lib/auth/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.homepage" });
  const title = t("title");
  const description = t("description");
  const url = locale === "en" ? "/" : `/${locale}`;
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      languages: { en: "/", hi: "/hi", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "Clipupp",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

type RenderContext = {
  newsletterCopy: { headline: string; subheadline: string; cta: string };
  settings: Record<string, unknown>;
};

type SectionBuilder = (s: HomepageSectionPayload, ctx: RenderContext) => ReactNode;

/**
 * Section background tier matrix — Phase 2 redesign.
 *
 * Every entry sets the section's own background. The pattern is "color is the
 * surface, white is the interruption" — hot sections are saturated, content-
 * heavy sections are soft tints, scan-dense sections stay white.
 */
const SECTION_RENDERERS: Record<string, SectionBuilder> = {
  // ── Hero — crimson mesh, owns its own padding + min-height clamp.
  hero_search: (s) => <HeroSearchSection section={s} />,

  // ── Personalised rail — white surface, content carries the colour.
  trending_stores: (s) => (
    <section className="clipupp-container py-12">
      <TrendingStoresRail section={s} />
    </section>
  ),

  // ── Promo banners — white (photos do the work).
  promo_banners: (s) => (
    <section className="clipupp-container pb-12">
      <PromoBannersCarousel section={s} />
    </section>
  ),

  // ── Savings stats — amber-soft band (peach).
  savings_stats: (s, ctx) => (
    <section className="clipupp-section-bg-accent-soft">
      <div className="clipupp-container py-14">
        <SavingsStatsStrip section={s} settings={ctx.settings} />
      </div>
    </section>
  ),

  // ── Featured stores — fade-down (white → primary-soft).
  featured_stores: (s) => (
    <section className="clipupp-section-bg-fade-down">
      <div className="clipupp-container py-14">
        <FeaturedStoresGrid section={s} />
      </div>
    </section>
  ),

  // ── Daily picks — white surface so the warm featured card pops.
  daily_picks: (s) => (
    <section className="clipupp-container py-14">
      <DailyPicksSection section={s} />
    </section>
  ),

  // ── Top deals — warm-taupe surface so brand-tinted cards sit at home.
  top_deals: (s) => (
    <section className="clipupp-section-bg-neutral">
      <div className="clipupp-container py-14">
        <TopDealsSection section={s} />
      </div>
    </section>
  ),

  // ── Editorial / blog — white surface; the photo-hero card is dark.
  editorial: (s) => (
    <section className="clipupp-container py-14">
      <BlogSection section={s} />
    </section>
  ),

  // ── Categories — primary-soft (crimson wash).
  popular_categories: (s) => (
    <section className="clipupp-section-bg-primary-soft">
      <div className="clipupp-container py-14">
        <PopularCategoriesGrid section={s} />
      </div>
    </section>
  ),

  // ── Trusted brands — white + marquee edge-fade (built into the component).
  trusted_brands: (s) => (
    <section className="clipupp-container py-14">
      <TrustedBrandsRail section={s} />
    </section>
  ),

  // ── Editorial tips — success-soft (mint band).
  editorial_tips: (s) => (
    <section className="clipupp-section-bg-success-soft">
      <div className="clipupp-container py-14">
        <EditorialTipsSection section={s} />
      </div>
    </section>
  ),

  // ── Guarantees — white surface; clipupp-edge-bar carries the colour per tile.
  guarantees: (s) => (
    <section className="clipupp-container py-14">
      <GuaranteeStrip section={s} />
    </section>
  ),

  // ── FAQ — primary-soft band, gradient chevron discs.
  faq: (s) => (
    <section className="clipupp-section-bg-primary-soft">
      <div className="clipupp-container py-14">
        <FaqSection section={s} />
      </div>
    </section>
  ),

  // ── Newsletter — amber mesh; component owns its own padding + bg.
  newsletter: (s, ctx) => (
    <NewsletterBar section={s} copy={ctx.newsletterCopy} />
  ),
};

/**
 * Server-rendered homepage. The order, enabled flag, item limits, and
 * per-section copy all come from /api/v1/homepage (admin-managed). Unknown
 * codes are dropped silently so renaming or retiring a section type is safe.
 *
 * Phase 2 redesign: every section reaches for a `clipupp-section-bg-*` helper so
 * the page reads as a rhythm of coloured blocks instead of one long white
 * scroll. See SECTION_RENDERERS above for the per-code background.
 */
export default async function HomePage() {
  const [layout, settings, user] = await Promise.all([
    homepageApi.getPublic(),
    getPublicSettings(),
    getServerSession(),
  ]);
  const allSections = layout?.sections ?? [];

  // "Your favorites & visited" (trending_stores) is signed-in-only. We pull
  // it out of the normal flow and render it after the hero when logged in.
  const trending = allSections.find((s) => s.code === "trending_stores");
  // Newsletter is pulled out so HowItWorks can render between content and
  // the signup CTA (hero → content → explainer → CTA).
  const newsletter = allSections.find((s) => s.code === "newsletter");
  const middleSections = allSections.filter(
    (s) => s.code !== "trending_stores" && s.code !== "newsletter"
  );

  const ctx: RenderContext = {
    newsletterCopy: {
      headline: asString(
        settings["newsletter.headline"],
        "Get the best deals weekly"
      ),
      subheadline: asString(
        settings["newsletter.subheadline"],
        "One email. No spam. Unsubscribe anytime."
      ),
      cta: asString(settings["newsletter.cta"], "Subscribe"),
    },
    settings,
  };

  // Build a single ordered list of every visual section on the page —
  // trending (logged-in only) → middle sections (admin-managed) →
  // HowItWorks (fixed) → newsletter. We then walk it with a single index
  // so the alternating-bg rule below can reason about positions
  // regardless of which renderer the admin picked for each slot.
  type Entry = { key: string; node: ReactNode; lockBg?: boolean };
  const entries: Entry[] = [];

  if (user && trending) {
    entries.push({
      key: trending.code,
      node: SECTION_RENDERERS[trending.code]?.(trending, ctx) ?? null,
    });
  }

  middleSections.forEach((s) => {
    const render = SECTION_RENDERERS[s.code];
    if (!render) return;
    entries.push({ key: s.code, node: render(s, ctx) });
  });

  entries.push({ key: "how_it_works", node: <HowItWorksSection /> });

  if (newsletter) {
    entries.push({
      key: newsletter.code,
      node: SECTION_RENDERERS[newsletter.code]?.(newsletter, ctx) ?? null,
      // Newsletter is the bottom lead-gen CTA — its white form text needs
      // a coloured background to remain visible, so it's exempt from the
      // alternating-bg rule below.
      lockBg: true,
    });
  }

  // Background rule: first two visual sections keep whatever bg their
  // renderer set (hero mesh + the section the admin pinned at position 2).
  // From position 3 onwards every section gets either bg-white or
  // bg-clipupp-neutral-50, alternating, *regardless* of which renderer occupies
  // that slot. `[&>section]:!bg-transparent` neutralises any bg the
  // renderer's <section> set so the wrapper's bg shows through.
  let alternationCount = 0;
  return (
    <div className="bg-white">
      {entries.map((e, idx) => {
        const lockBg = idx < 2 || e.lockBg;
        if (lockBg) {
          return (
            <div key={e.key} id={e.key} className="scroll-mt-24">
              {e.node}
            </div>
          );
        }
        const bgClass =
          alternationCount % 2 === 0 ? "bg-white" : "bg-clipupp-neutral-50";
        alternationCount++;
        return (
          <div
            key={e.key}
            id={e.key}
            className={`scroll-mt-24 ${bgClass} [&>section]:!bg-transparent`}
          >
            {e.node}
          </div>
        );
      })}
    </div>
  );
}
