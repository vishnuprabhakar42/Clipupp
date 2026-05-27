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
      siteName: "CouponValley",
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

const SECTION_RENDERERS: Record<string, SectionBuilder> = {
  // ── NEW: top-of-page hero with prominent search + category quick-jumps.
  // Owns its own padding + flat brand-soft background.
  hero_search: (s) => <HeroSearchSection section={s} />,

  trending_stores: (s) => (
    <section className="container py-10">
      <TrendingStoresRail section={s} />
    </section>
  ),
  promo_banners: (s) => (
    <section className="container pb-10">
      <PromoBannersCarousel section={s} />
    </section>
  ),
  // ── NEW: four big numeric stat tiles. Social proof above the fold.
  savings_stats: (s, ctx) => (
    <section className="container py-12">
      <SavingsStatsStrip section={s} settings={ctx.settings} />
    </section>
  ),
  featured_stores: (s) => (
    <section className="bg-cv-neutral-50">
      <div className="container py-12">
        <FeaturedStoresGrid section={s} />
      </div>
    </section>
  ),
  // ── NEW: editorial 1-large + 3-small picks layout (different rhythm
  // from the uniform top_deals grid).
  daily_picks: (s) => (
    <section className="container py-12">
      <DailyPicksSection section={s} />
    </section>
  ),
  top_deals: (s) => (
    <section className="container py-12">
      <TopDealsSection section={s} />
    </section>
  ),
  editorial: (s) => (
    <section className="container py-12">
      <BlogSection section={s} />
    </section>
  ),
  popular_categories: (s) => (
    <section className="bg-cv-neutral-50">
      <div className="container py-12">
        <PopularCategoriesGrid section={s} />
      </div>
    </section>
  ),
  trusted_brands: (s) => (
    <section className="container py-12">
      <TrustedBrandsRail section={s} />
    </section>
  ),
  // ── NEW: editorial "smart ways to save" tips — 4 columns, content-heavy
  // for category-page SEO.
  editorial_tips: (s) => (
    <section className="bg-cv-neutral-50">
      <div className="container py-12">
        <EditorialTipsSection section={s} />
      </div>
    </section>
  ),
  // ── NEW: trust strip — 4 inline value props (verified, free, no spam,
  // editor curated). Builds confidence before the FAQ + newsletter CTA.
  guarantees: (s) => (
    <section className="container py-12">
      <GuaranteeStrip section={s} />
    </section>
  ),
  // ── NEW: FAQ accordion with FAQPage JSON-LD for rich search results.
  faq: (s) => (
    <section className="container py-12">
      <FaqSection section={s} />
    </section>
  ),
  newsletter: (s, ctx) => (
    // Full-width band — NewsletterBar owns its own padding + bg so the
    // top/bottom gaps are symmetric and visually flush with neighbouring
    // sections instead of floating as a contained card.
    <NewsletterBar section={s} copy={ctx.newsletterCopy} />
  ),
};

/**
 * Server-rendered homepage. The order, enabled flag, item limits, and
 * per-section copy all come from /api/v1/homepage (admin-managed). Unknown
 * codes are dropped silently so renaming or retiring a section type is safe.
 */
export default async function HomePage() {
  const [layout, settings, user] = await Promise.all([
    homepageApi.getPublic(),
    getPublicSettings(),
    getServerSession(),
  ]);
  const allSections = layout?.sections ?? [];

  // "Your favorites & visited" (trending_stores) is signed-in-only. We pull
  // it out of the normal flow, drop it from the iteration, and render it
  // at the very top of the page when the user is logged in.
  const trending = allSections.find((s) => s.code === "trending_stores");
  // Newsletter is pulled out so HowItWorks can render between content and
  // the signup CTA (uupm.cc-style flow: hero → content → explainer → CTA).
  const newsletter = allSections.find((s) => s.code === "newsletter");
  const middleSections = allSections.filter(
    (s) => s.code !== "trending_stores" && s.code !== "newsletter"
  );

  const ctx: RenderContext = {
    newsletterCopy: {
      headline: asString(settings["newsletter.headline"], "Get the best deals weekly"),
      subheadline: asString(
        settings["newsletter.subheadline"],
        "One email. No spam. Unsubscribe anytime."
      ),
      cta: asString(settings["newsletter.cta"], "Subscribe"),
    },
    settings,
  };

  return (
    <div className="bg-white">
      {/* Personalised rail — only visible to signed-in users. */}
      {user && trending && (
        <div id={trending.code} className="scroll-mt-24">
          {SECTION_RENDERERS[trending.code]?.(trending, ctx)}
        </div>
      )}

      {middleSections.map((s) => {
        const render = SECTION_RENDERERS[s.code];
        if (!render) return null;
        // id={s.code} lets /admin/homepage's "Preview" link deep-link via
        // /#<section_code> and scroll the user straight to the right block.
        return (
          <div key={s.code} id={s.code} className="scroll-mt-24">
            {render(s, ctx)}
          </div>
        );
      })}

      {/* uupm.cc-style 3-step explainer, before the signup CTA. */}
      <HowItWorksSection />

      {/* Newsletter signup — always last so the page ends on the lead-gen CTA. */}
      {newsletter && (
        <div id={newsletter.code} className="scroll-mt-24">
          {SECTION_RENDERERS[newsletter.code]?.(newsletter, ctx)}
        </div>
      )}
    </div>
  );
}
