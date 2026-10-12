import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { homepageApi, type HomepageLayout, type HomepageSectionPayload } from "@/lib/api/homepage";
import { getPublicSettings, asString } from "@/lib/api/settings";
import { HeroSection } from "@/features/home/components/HeroSection";
import { TrendingCouponsRail } from "@/features/home/components/TrendingCouponsRail";
import { TopStoresGrid } from "@/features/home/components/TopStoresGrid";
import { TabbedCoupons } from "@/features/home/components/TabbedCoupons";
import { BankOffersHub } from "@/features/home/components/BankOffersHub";
import { VerifyBand } from "@/features/home/components/VerifyBand";
import { NewsletterBar } from "@/features/home/components/NewsletterBar";
import { SectionHeader } from "@/features/home/components/SectionHeader";
import { RevealRoot } from "@/features/home/components/Reveal";

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

type Ctx = {
  stats: HomepageLayout["stats"];
  banks: string[];
  newsletter: { headline: string; subheadline: string; cta: string; whatsapp?: string };
};

type SectionBuilder = (s: HomepageSectionPayload, ctx: Ctx) => ReactNode;

/**
 * Seven-block homepage (spec 2026-10-12-homepage-v2-design.md). Order and
 * copy come from /api/v1/homepage; unknown or legacy codes render nothing,
 * so an admin re-enabling a retired section is harmless. Each renderer owns
 * its surface: hero (tint-50) and verify band (tint-100) are the only
 * tinted blocks.
 */
const SECTION_RENDERERS: Record<string, SectionBuilder> = {
  hero_search: (s, ctx) => <HeroSection section={s} stats={ctx.stats} />,
  trending_coupons: (s) => <TrendingCouponsRail section={s} />,
  featured_stores: (s, ctx) => <TopStoresGrid section={s} stats={ctx.stats} />,
  top_deals: (s) =>
    (s.categoryTabs ?? []).length === 0 ? null : (
      <section className="clipupp-container pb-12 lg:pb-24" id="today" aria-labelledby="today-heading">
        <SectionHeader eyebrow={s.subtitle} title={s.title} id="today-heading" />
        <TabbedCoupons tabs={s.categoryTabs ?? []} />
      </section>
    ),
  bank_offers: (s, ctx) => <BankOffersHub section={s} banks={ctx.banks} />,
  verify_band: (s) => <VerifyBand section={s} />,
  newsletter: (s, ctx) => <NewsletterBar section={s} copy={ctx.newsletter} />,
};

const EMPTY_STATS = { verifiedLast7d: 0, activeCoupons: 0, activeStores: 0 };

/**
 * Used when /api/v1/homepage is unreachable or returns nothing: a bare hero
 * renders from message defaults (H1, subline, search) so the page always has
 * its heading and search instead of an empty band between header and footer.
 */
const FALLBACK_SECTIONS: HomepageSectionPayload[] = [
  {
    code: "hero_search",
    title: "",
    subtitle: null,
    itemLimit: null,
    stores: null,
    coupons: null,
    categories: null,
    categoryTabs: null,
    campaigns: null,
  },
];

export default async function HomePage() {
  const [layout, settings] = await Promise.all([homepageApi.getPublic(), getPublicSettings()]);
  const sections = layout?.sections?.length ? layout.sections : FALLBACK_SECTIONS;
  const ctx: Ctx = {
    stats: layout?.stats ?? EMPTY_STATS,
    banks: asString(settings["bank_offers.banks"], "")
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean),
    newsletter: {
      // Empty means "use the localized default" inside NewsletterBar.
      headline: asString(settings["newsletter.headline"], ""),
      subheadline: asString(settings["newsletter.subheadline"], ""),
      cta: asString(settings["newsletter.cta"], ""),
      whatsapp: asString(settings["social.whatsapp"], "") || undefined,
    },
  };

  return (
    <RevealRoot>
      <div className="bg-white">
        {sections.map((s) => {
          const render = SECTION_RENDERERS[s.code];
          if (!render) return null;
          const node = render(s, ctx);
          if (!node) return null;
          return (
            <div key={s.code} id={s.code} className="scroll-mt-20">
              {node}
            </div>
          );
        })}
      </div>
    </RevealRoot>
  );
}
