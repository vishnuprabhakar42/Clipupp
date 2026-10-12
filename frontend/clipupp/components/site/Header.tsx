import { Suspense } from "react";
import { rootCategories } from "@/lib/home/categoryLabel";
import { getHomeFeed } from "@/lib/home/getHomeFeed";
import { AnnouncementStrip } from "@/features/home/components/AnnouncementStrip";
import { HeaderClient, type HeaderFeed } from "./HeaderClient";

/**
 * Header - server wrapper. Reads the cached HomeFeed (the same call the page
 * makes), maps it to light DTOs for the mega menu and search, and renders the
 * announcement strip above the interactive shell. The strip reads cookies(),
 * so it streams in inside Suspense and the rest of the shell stays static.
 */
export async function Header() {
  const feed = await getHomeFeed();
  const storeName = new Map(feed.stores.map((s) => [s.id, s.name]));
  const light: HeaderFeed = {
    categories: rootCategories(feed.categories).slice(0, 16),
    totalCoupons: feed.stats.activeCoupons,
    search: {
      stores: feed.stores.map((s) => ({ id: s.id, name: s.name, coupons: s.coupons, popular: s.popular })),
      coupons: feed.coupons.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        code: c.code,
        storeName: storeName.get(c.store) ?? c.store,
      })),
      deals: feed.deals.map((d) => ({ id: d.id, title: d.title, price: d.price })),
      bankOfferCount: feed.bankOffers.length,
    },
  };
  return (
    <>
      <Suspense fallback={null}>
        <AnnouncementStrip />
      </Suspense>
      <HeaderClient feed={light} />
    </>
  );
}
