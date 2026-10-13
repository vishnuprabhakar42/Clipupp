import { getTranslations } from "next-intl/server";
import { rootCategories } from "@/lib/home/categoryLabel";
import { getHomeFeed } from "@/lib/home/getHomeFeed";
import { renderedAnchors } from "@/lib/home/anchors";
import { CategoryRailClient } from "./CategoryRailClient";

/** The design shows 11 chips; the backend can have far more. */
const RAIL_MAX = 11;

/** Category chip rail under the header (homepage only, rendered by the homepage page). */
export async function CategoryRail() {
  const [feed, t] = await Promise.all([getHomeFeed(), getTranslations("header")]);
  if (feed.categories.length === 0) return null;
  return (
    <CategoryRailClient
      categories={rootCategories(feed.categories).slice(0, RAIL_MAX)}
      ariaLabel={t("categories")}
      calendarOnPage={renderedAnchors(feed).includes("calendar")}
    />
  );
}
