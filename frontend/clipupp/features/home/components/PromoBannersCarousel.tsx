import { bannersApi, type BannerDetail } from "@/lib/api/banners";
import type { HomepageSectionPayload } from "@/lib/api/homepage";
import { PromoBannersCarouselClient, type Slide } from "./PromoBannersCarouselClient";

/**
 * Promo banner carousel — server wrapper. Fetches all live banners
 * server-side and hands them to the client carousel for auto-rotate /
 * arrow navigation. Hides entirely when no banners are configured (no
 * skeleton flash).
 */
export async function PromoBannersCarousel({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  section,
}: { section?: HomepageSectionPayload | null } = {}) {
  let banners: BannerDetail[] = [];
  try {
    banners = (await bannersApi.list()) ?? [];
  } catch {
    banners = [];
  }
  if (banners.length === 0) return null;

  const slides: Slide[] = banners.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle ?? "",
    linkUrl: b.linkUrl,
    imageUrl: b.imageUrl,
  }));

  return <PromoBannersCarouselClient slides={slides} />;
}
