import { cache } from "react";
import { cookies, headers } from "next/headers";
import { API_BASE } from "@/lib/api/client";
import type { UserSummary } from "@/lib/api/types";

/**
 * Server-side helper for layouts/pages that need to know whether the visitor
 * is logged in. Calls a *non-rotating* /auth/whoami endpoint that validates
 * the cv_rt cookie and returns the user without consuming a refresh token.
 * The previous implementation rotated on every render, which made the
 * second navigation look like a replay attack and revoked the session.
 *
 * Wrapped in React's cache() so multiple calls during a single server
 * render dedupe to one HTTP round-trip.
 *
 * Returns null when:
 *   - no refresh cookie present
 *   - whoami fails (expired / revoked / unknown user)
 */
export const getServerSession = cache(async (): Promise<UserSummary | null> => {
  const cookieStore = await cookies();
  const rt = cookieStore.get("cv_rt");
  if (!rt) {
    console.warn("[getServerSession] no cv_rt cookie on this request");
    return null;
  }

  try {
    const url = `${API_BASE}/api/v1/auth/whoami`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Cookie: `cv_rt=${rt.value}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(
        `[getServerSession] whoami returned ${res.status} for cookie len=${rt.value.length}`
      );
      return null;
    }
    return (await res.json()) as UserSummary;
  } catch (e) {
    console.warn("[getServerSession] whoami threw:", e);
    return null;
  }
});

/** Convenience: read the locale that should drive translations / `<html lang>`. */
export async function getServerLocale(): Promise<string> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("cv_locale")?.value;
  if (localeCookie) return localeCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  const primary = accept.split(",")[0]?.split("-")[0]?.toLowerCase();
  return primary && /^[a-z]{2}$/.test(primary) ? primary : "en";
}
