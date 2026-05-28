import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api/client";

/**
 * Server-side fetch helper for admin pages. Refreshes the user's access
 * token via the clipupp_rt cookie, then forwards to the requested admin endpoint
 * with `Authorization: Bearer ...`.
 *
 * Returns null on auth failure (page should fall back to its empty/error UI).
 */
export async function adminFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T | null> {
  const cookieStore = await cookies();
  const rt = cookieStore.get("clipupp_rt");
  if (!rt) return null;

  try {
    const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `clipupp_rt=${rt.value}` },
      cache: "no-store",
    });
    if (!refreshRes.ok) return null;
    const { accessToken } = (await refreshRes.json()) as { accessToken: string };

    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
