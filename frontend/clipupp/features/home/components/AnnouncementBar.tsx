import { cookies } from "next/headers";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { bannersApi, type BannerDetail } from "@/lib/api/banners";
import { campaignsApi, type CampaignDetail } from "@/lib/api/campaigns";
import { AnnouncementDismissButton } from "./AnnouncementDismissButton";
import { ANNOUNCEMENT_COOKIE } from "./announcementConstants";

type Resolved = {
  id: string;
  title: string;
  subtitle?: string | null;
  linkUrl?: string | null;
  themeColor?: string | null;
};

/**
 * Slim dismissible announcement bar above the header. An active campaign
 * (window-bound, with a hero/cta defined) takes precedence over the
 * banner-driven default.
 *
 * Visual tier (Phase 2): crimson → amber gradient background with a live
 * pulse-dot indicator. The brand's hottest top-of-page CTA. Dismissal
 * state persists in a cookie keyed by announcement id (clipupp_announcement_
 * dismissed) so a new announcement / campaign re-shows itself.
 */
export async function AnnouncementBar() {
  const resolved = await resolveAnnouncement();
  if (!resolved) return null;

  const jar = await cookies();
  const dismissedId = jar.get(ANNOUNCEMENT_COOKIE)?.value;
  if (dismissedId === resolved.id) return null;

  // Honour an explicit campaign theme color as a solid fill; otherwise the
  // announcement bar uses the brand primary blue. Gradients are reserved for
  // the homepage hero + primary CTAs in the clean palette.
  const useThemeColor = !!resolved.themeColor;
  const bgStyle: React.CSSProperties = useThemeColor
    ? { backgroundColor: resolved.themeColor! }
    : {};

  return (
    <div
      className={`relative text-white ${useThemeColor ? "" : "bg-clipupp-primary"}`}
      style={bgStyle}
    >
      <div className="clipupp-container flex items-center justify-center gap-3 px-12 py-2.5 text-center text-sm">
        <span className="clipupp-pulse-dot shrink-0" aria-hidden />
        <p className="line-clamp-1 font-display">
          <span className="font-extrabold uppercase tracking-[0.08em]">
            {resolved.title}
          </span>
          {resolved.subtitle && (
            <>
              {" "}
              <span className="mx-2 text-white/60">|</span>
              {resolved.linkUrl ? (
                <Link
                  href={resolved.linkUrl}
                  className="inline-flex items-center gap-1 font-bold underline-offset-2 hover:underline"
                >
                  {resolved.subtitle}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : (
                <span className="font-bold">{resolved.subtitle}</span>
              )}
            </>
          )}
        </p>
      </div>
      <AnnouncementDismissButton id={resolved.id} />
    </div>
  );
}

async function resolveAnnouncement(): Promise<Resolved | null> {
  let campaign: CampaignDetail | null = null;
  try {
    campaign = await campaignsApi.getActive();
  } catch {
    campaign = null;
  }
  if (campaign && (campaign.heroTitle || campaign.ctaLabel)) {
    return {
      id: `campaign:${campaign.id}`,
      title: campaign.heroTitle ?? campaign.name,
      subtitle: campaign.ctaLabel,
      linkUrl: campaign.ctaUrl,
      themeColor: campaign.themeColor,
    };
  }
  let topBanner: BannerDetail | undefined;
  try {
    const banners = await bannersApi.list({ placement: "TOP_BAR" });
    topBanner = banners?.[0];
  } catch {
    topBanner = undefined;
  }
  if (topBanner) {
    return {
      id: topBanner.id,
      title: topBanner.title,
      subtitle: topBanner.subtitle,
      linkUrl: topBanner.linkUrl,
    };
  }
  return null;
}
