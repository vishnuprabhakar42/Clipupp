import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { campaignsApi } from "@/lib/api/campaigns";
import { bannersApi } from "@/lib/api/banners";
import { getHomeFeed } from "@/lib/home/getHomeFeed";
import { festivalLabel } from "@/lib/format/festival";
import { DiyaIcon } from "@/components/site/CategoryGlyph";
import { AnnouncementDismissButton } from "./AnnouncementDismissButton";
import { ANNOUNCEMENT_COOKIE } from "./announcementConstants";

type Resolved = { id: string; text: string; linkUrl: string | null };

/**
 * Deep-purple strip above the header: gold diya, "<festival label> · <admin
 * announcement>", a "See offers" link and a cookie-backed dismiss button.
 * Renders nothing when there is neither a festival nor an announcement.
 * Reads cookies(), so the caller wraps it in <Suspense>.
 */
export async function AnnouncementStrip() {
  const [feed, announcement, t] = await Promise.all([
    getHomeFeed(),
    resolveAnnouncement(),
    getTranslations("strip"),
  ]);
  const label = feed.festival ? festivalLabel(feed.festival.name, feed.festival.date) : null;
  if (!label && !announcement) return null;

  const id = announcement?.id ?? `festival:${feed.festival?.name ?? ""}`;
  const jar = await cookies();
  if (jar.get(ANNOUNCEMENT_COOKIE)?.value === id) return null;

  const linkClass =
    "shrink-0 whitespace-nowrap font-semibold text-clipupp-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-gold rounded-sm";
  return (
    <section aria-label={t("aria")} className="bg-clipupp-deep text-white">
      <div className="clipupp-container flex min-h-10 items-center gap-2.5 py-1 text-[13px] sm:gap-3 lg:text-sm">
        <DiyaIcon className="h-5 w-5 shrink-0 text-clipupp-gold" />
        <p className="min-w-0 flex-1 truncate">
          {label ? <b className="font-semibold">{label}</b> : null}
          {label && announcement ? <span className="text-white/60"> · </span> : null}
          {announcement ? <span className="text-white/85">{announcement.text}</span> : null}
        </p>
        {announcement?.linkUrl && !announcement.linkUrl.startsWith("#") ? (
          <Link href={announcement.linkUrl} className={linkClass}>
            {t("seeOffers")}
          </Link>
        ) : (
          <Link href="/#bank" className={linkClass}>
            {t("seeOffers")}
          </Link>
        )}
        <AnnouncementDismissButton id={id} label={t("dismiss")} />
      </div>
    </section>
  );
}

/** Active campaign first, then the TOP_BAR banner (same sources as the old bar). */
async function resolveAnnouncement(): Promise<Resolved | null> {
  try {
    const campaign = await campaignsApi.getActive();
    if (campaign && (campaign.heroTitle || campaign.ctaLabel)) {
      return {
        id: `campaign:${campaign.id}`,
        text: campaign.heroTitle ?? campaign.name,
        linkUrl: campaign.ctaUrl ?? null,
      };
    }
  } catch {
    /* fall through to banners */
  }
  try {
    const banner = (await bannersApi.list({ placement: "TOP_BAR" }))?.[0];
    if (banner) {
      return {
        id: banner.id,
        text: [banner.title, banner.subtitle].filter(Boolean).join(" · "),
        linkUrl: banner.linkUrl ?? null,
      };
    }
  } catch {
    /* none */
  }
  return null;
}
