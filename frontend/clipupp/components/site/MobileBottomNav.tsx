import { getTranslations } from "next-intl/server";
import { BottomNavClient } from "@/components/site/BottomNavClient";
import { getHomeFeed } from "@/lib/home/getHomeFeed";
import { renderedAnchors } from "@/lib/home/anchors";

/** Mobile bottom navigation (below lg): labels resolved on the server, behaviour in the client leaf. */
export async function MobileBottomNav() {
  const [t, feed] = await Promise.all([getTranslations("mobileNav"), getHomeFeed()]);
  return (
    <BottomNavClient
      ariaLabel={t("aria")}
      anchors={renderedAnchors(feed)}
      labels={{ home: t("home"), deals: t("deals"), coupons: t("coupons"), stores: t("stores"), saved: t("saved") }}
    />
  );
}
