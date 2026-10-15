/**
 * Demo feed is on when NEXT_PUBLIC_HOME_DEMO_FEED is "true", or in development
 * unless it is explicitly "false". Production builds never mix fixtures in
 * unless the variable says "true".
 */
export function isDemoFeedEnabled(env: string | undefined = process.env.NEXT_PUBLIC_HOME_DEMO_FEED, nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
  return env === "true" || (nodeEnv === "development" && env !== "false");
}
