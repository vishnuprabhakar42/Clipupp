import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { homepageApi, type HomepageLayout, type HomepageSectionPayload } from "@/lib/api/homepage";
import { getPublicSettings, asString } from "@/lib/api/settings";
import { getHomeFeed } from "@/lib/home/getHomeFeed";
import type { HomeFeed } from "@/lib/home/feed";
import { LiveTicker } from "@/features/home/components/LiveTicker";
import { PopularStoresStrip } from "@/features/home/components/PopularStoresStrip";
import { HeroSection } from "@/features/home/components/HeroSection";
import { TrendingRail } from "@/features/home/components/TrendingRail";
import { TopStoresGrid } from "@/features/home/components/TopStoresGrid";
import { TodaysCoupons } from "@/features/home/components/TodaysCoupons";
import { BankOffersRail } from "@/features/home/components/BankOffersRail";
import { DealsRail } from "@/features/home/components/DealsRail";
import { SaleCalendarRail } from "@/features/home/components/SaleCalendarRail";
import { VerifyBand } from "@/features/home/components/VerifyBand";
import { NewsletterBar } from "@/features/home/components/NewsletterBar";
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
  feed: HomeFeed;
  stats: HomepageLayout["stats"];
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
  hero_search: (s, ctx) => <HeroSection feed={ctx.feed} section={s} />,
  ticker: (_s, ctx) => <LiveTicker coupons={ctx.feed.coupons} stores={ctx.feed.stores} />,
  popular_stores: (_s, ctx) => <PopularStoresStrip stores={ctx.feed.stores} />,
  trending_coupons: (s, ctx) => <TrendingRail feed={ctx.feed} section={s} />,
  featured_stores: (_s, ctx) => <TopStoresGrid feed={ctx.feed} />,
  deals: (_s, ctx) => <DealsRail feed={ctx.feed} />,
  sale_calendar: (_s, ctx) => <SaleCalendarRail feed={ctx.feed} />,
  top_deals: (s, ctx) => <TodaysCoupons feed={ctx.feed} section={s} />,
  bank_offers: (_s, ctx) => <BankOffersRail feed={ctx.feed} />,
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
  const [layout, settings, feed] = await Promise.all([homepageApi.getPublic(), getPublicSettings(), getHomeFeed()]);
  const base = layout?.sections?.length ? layout.sections : FALLBACK_SECTIONS;
  // Order follows the feed (demo mode adds ticker and popular_stores, which
  // have no backend row); step 10 finalises this.
  const sections = feed.sectionOrder.length
    ? feed.sectionOrder.map((code) => base.find((b) => b.code === code) ?? { ...FALLBACK_SECTIONS[0], code })
    : base;
  const ctx: Ctx = {
    feed,
    stats: layout?.stats ?? EMPTY_STATS,
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
      <div className="bg-clipupp-neutral-50">
        {sections.map((s) => {
          const render = SECTION_RENDERERS[s.code];
          if (!render) return null;
          const node = render(s, ctx);
          if (!node) return null;
          return (
            <div key={s.code} id={s.code === "deals" ? undefined : s.code} className="scroll-mt-20">
              {node}
            </div>
          );
        })}
      </div>
    </RevealRoot>
  );
}
