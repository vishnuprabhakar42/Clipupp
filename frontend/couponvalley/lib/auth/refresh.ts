import { tokenStore } from "./token-store";

/**
 * Single-flight access-token refresh. All API clients (apiClient, mediaApi,
 * any future ones) MUST import this rather than rolling their own — otherwise
 * concurrent 401 retries from different clients hit /auth/refresh in
 * parallel, and the second one trips the backend's replay-detection (since
 * the first already rotated the same refresh token) → session revoked.
 *
 * IMPORTANT: on failure we ONLY clear the in-memory access token. We do
 * NOT call /auth/logout to delete the cookie — doing so was too aggressive
 * and locked users out on any transient blip. If the cookie is genuinely
 * dead, the next refresh attempt will keep returning 401 (idempotent), and
 * the user can sign in again or close the tab. We never destroy cookie state
 * automatically.
 */

let inflight: Promise<string | null> | null = null;

const BASE = typeof window === "undefined"
  ? process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080"
  : "";

export function refreshAccessToken(): Promise<string | null> {
  if (!inflight) {
    inflight = (async () => {
      try {
        const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) {
          // Surface enough context to debug in the browser console.
          if (typeof window !== "undefined") {
            const bodyText = await res.text().catch(() => "");
            // eslint-disable-next-line no-console
            console.warn(
              `[refresh] failed status=${res.status} body=${bodyText.slice(0, 200)}`
            );
          }
          tokenStore.clear();
          return null;
        }
        const body = (await res.json()) as { accessToken?: string };
        if (!body.accessToken) {
          // eslint-disable-next-line no-console
          if (typeof window !== "undefined") console.warn("[refresh] no accessToken in response body");
          tokenStore.clear();
          return null;
        }
        tokenStore.set(body.accessToken);
        return body.accessToken;
      } catch (e) {
        // eslint-disable-next-line no-console
        if (typeof window !== "undefined") console.warn("[refresh] threw:", e);
        tokenStore.clear();
        return null;
      } finally {
        inflight = null;
      }
    })();
  }
  return inflight;
}
