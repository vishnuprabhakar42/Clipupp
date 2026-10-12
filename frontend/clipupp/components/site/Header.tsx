import { Suspense } from "react";
import { rootCategories } from "@/lib/home/categoryLabel";
import { toSearchFeed } from "@/lib/home/searchFeed";
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
  const light: HeaderFeed = {
    categories: rootCategories(feed.categories).slice(0, 16),
    totalCoupons: feed.stats.activeCoupons,
    search: toSearchFeed(feed),
    saved: {
      coupons: feed.coupons,
      stores: feed.stores,
      categories: feed.categories.map((c) => ({ id: c.id, name: c.name })),
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
