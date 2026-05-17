import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { TrendingStoresRail } from "@/features/home/components/TrendingStoresRail";
import { PromoBannersCarousel } from "@/features/home/components/PromoBannersCarousel";
import { FeaturedStoresGrid } from "@/features/home/components/FeaturedStoresGrid";
import { TopDealsSection } from "@/features/home/components/TopDealsSection";
import { BlogSection } from "@/features/home/components/BlogSection";
import { PopularCategoriesGrid } from "@/features/home/components/PopularCategoriesGrid";
import { NewsletterBar } from "@/features/home/components/NewsletterBar";
import { TrustedBrandsRail } from "@/features/home/components/TrustedBrandsRail";
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
};

type SectionBuilder = (s: HomepageSectionPayload, ctx: RenderContext) => ReactNode;

const SECTION_RENDERERS: Record<string, SectionBuilder> = {
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
  featured_stores: (s) => (
    <section className="bg-cv-neutral-50">
      <div className="container py-12">
        <FeaturedStoresGrid section={s} />
      </div>
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
  newsletter: (s, ctx) => (
    <section className="container pb-12 pt-4">
      <NewsletterBar section={s} copy={ctx.newsletterCopy} />
    </section>
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
  const sections = allSections.filter((s) => s.code !== "trending_stores");

  const ctx: RenderContext = {
    newsletterCopy: {
      headline: asString(settings["newsletter.headline"], "Get the best deals weekly"),
      subheadline: asString(
        settings["newsletter.subheadline"],
        "One email. No spam. Unsubscribe anytime."
      ),
      cta: asString(settings["newsletter.cta"], "Subscribe"),
    },
  };

  return (
    <div className="bg-white">
      {/* Personalised rail — only visible to signed-in users, always first. */}
      {user && trending && (
        <div id={trending.code} className="scroll-mt-24">
          {SECTION_RENDERERS[trending.code]?.(trending, ctx)}
        </div>
      )}

      {sections.map((s) => {
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
    </div>
  );
}
