import { getTranslations } from "next-intl/server";
import { BottomNavClient } from "@/components/site/BottomNavClient";

/** Mobile bottom navigation (below lg): labels resolved on the server, behaviour in the client leaf. */
export async function MobileBottomNav() {
  const t = await getTranslations("mobileNav");
  return (
    <BottomNavClient
      ariaLabel={t("aria")}
      labels={{ home: t("home"), deals: t("deals"), coupons: t("coupons"), stores: t("stores"), saved: t("saved") }}
    />
  );
}
