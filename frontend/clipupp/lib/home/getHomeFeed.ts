import { cache } from "react";
import { homepageApi } from "@/lib/api/homepage";
import { getPublicSettings } from "@/lib/api/settings";
import { toHomeFeed } from "./adapter";
import type { HomeFeed } from "./feed";

/**
 * Server helper: the homepage feed for this request. Reads the layout and
 * public settings in parallel; both helpers swallow errors, so this never
 * throws. Fixture data is only mixed in when NEXT_PUBLIC_HOME_DEMO_FEED is
 * "true" (development only, production never sets it).
 */
export const getHomeFeed = cache(async (): Promise<HomeFeed> => {
  const [layout, settings] = await Promise.all([homepageApi.getPublic(), getPublicSettings()]);
  return toHomeFeed(layout, settings, { demo: process.env.NEXT_PUBLIC_HOME_DEMO_FEED === "true" });
});
