import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { homepageApi, type HomepageLayout, type HomepageSectionPayload } from "@/lib/api/homepage";
import { getHomeFeed } from "@/lib/home/getHomeFeed";
import type { HomeFeed } from "@/lib/home/feed";
import { sectionRenders } from "@/lib/home/anchors";
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
import { AlertsSection } from "@/features/home/components/AlertsSection";
import { FaqSection } from "@/features/home/components/FaqSection";
import { RevealRoot } from "@/features/home/components/Reveal";
import { CategoryRail } from "@/features/home/components/CategoryRail";
import { SavedSheetSeed } from "@/features/home/components/SavedSheetSeed";
import { JsonLd } from "@/lib/seo/jsonLd";
import { canonicalFor } from "@/lib/seo/urls";
import type { Locale } from "@/lib/i18n/config";


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
};

type SectionBuilder = (s: HomepageSectionPayload, ctx: Ctx) => ReactNode;

/**
 * Twelve-block homepage (spec 2026-10-12-homepage-v3-design.md). Order comes
 * from `feed.sectionOrder`; unknown or legacy codes render nothing, so an admin
 * re-enabling a retired section is harmless. Each renderer takes the section
 * payload and the feed.
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
  verify_band: (_s, ctx) => <VerifyBand feed={ctx.feed} />,
  alerts: (_s, ctx) => <AlertsSection feed={ctx.feed} />,
  // Until the backend renames the row, the old newsletter code renders the alerts block.
  newsletter: (_s, ctx) => <AlertsSection feed={ctx.feed} />,
  faq: (_s, ctx) => <FaqSection feed={ctx.feed} />,
};

/** Sections whose own `<section id>` equals the code; the wrapper skips the id so it is not duplicated. */
const OWNS_ID = new Set(["deals", "alerts", "faq"]);

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

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const [layout, feed] = await Promise.all([homepageApi.getPublic(), getHomeFeed()]);
  const base = layout?.sections?.length ? layout.sections : FALLBACK_SECTIONS;
  // Order follows the feed; in demo mode the adapter has already inserted the
  // design sections the backend lacks, in production only backend codes render.
  const sections = feed.sectionOrder.length
    ? feed.sectionOrder.map((code) => base.find((b) => b.code === code) ?? { ...FALLBACK_SECTIONS[0], code })
    : base;
  const ctx: Ctx = {
    feed,
    stats: layout?.stats ?? EMPTY_STATS,
  };

  const trending = feed.coupons
    .filter((c) => c.trending != null)
    .sort((a, b) => (a.trending ?? 0) - (b.trending ?? 0))
    .slice(0, 10);

  return (
    <>
      {/* Homepage only: the rail sits right under the sticky header, above the sections. */}
      <CategoryRail />
      <RevealRoot>
        <SavedSheetSeed seed={{ coupons: feed.coupons, stores: feed.stores, categories: feed.categories }} />
        {trending.length > 0 && (
          <JsonLd
            id="ld-trending"
            data={{
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: trending.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: c.title,
                url: canonicalFor(`/coupons/${c.slug}`, locale),
              })),
            }}
          />
        )}
        <div className="bg-clipupp-page pb-10 md:pb-14 lg:pb-[72px]">
          {sections.map((s) => {
            const render = SECTION_RENDERERS[s.code];
            // Same test the anchors use, so a link never targets a block that is not here.
            if (!render || !sectionRenders(s.code, feed)) return null;
            const node = render(s, ctx);
            if (!node) return null;
            const block = (
              <div id={OWNS_ID.has(s.code) ? undefined : s.code} className="scroll-mt-[var(--clipupp-hv)]">
                {node}
              </div>
            );
            // The hero is also the "top" anchor.
            return s.code === "hero_search" ? (
              <div key={s.code} id="top" className="scroll-mt-[var(--clipupp-hv)]">
                {block}
              </div>
            ) : (
              <Fragment key={s.code}>{block}</Fragment>
            );
          })}
        </div>
      </RevealRoot>
    </>
  );
}
