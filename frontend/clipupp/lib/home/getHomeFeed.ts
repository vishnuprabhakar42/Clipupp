import { cache } from "react";
import { homepageApi } from "@/lib/api/homepage";
import { getPublicSettings } from "@/lib/api/settings";
import { toHomeFeed } from "./adapter";
import { isDemoFeedEnabled } from "./demoFlag";
import type { HomeFeed } from "./feed";

/**
 * Server helper: the homepage feed for this request. Reads the layout and
 * public settings in parallel; both helpers swallow errors, so this never
 * throws. Fixture data is only mixed in for the demo feed, see `isDemoFeedEnabled` in ./demoFlag.
 */
export const getHomeFeed = cache(async (): Promise<HomeFeed> => {
  const [layout, settings] = await Promise.all([homepageApi.getPublic(), getPublicSettings()]);
  return toHomeFeed(layout, settings, { demo: isDemoFeedEnabled() });
});
