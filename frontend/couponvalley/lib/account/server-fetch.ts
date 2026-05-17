import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api/client";

/**
 * Server-side fetch for /api/v1/account/* endpoints. Mirrors adminFetch but
 * for any authed user (no role gate). Returns null on auth failure so
 * pages can render an empty/error state.
 */
export async function accountFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T | null> {
  const cookieStore = await cookies();
  const rt = cookieStore.get("cv_rt");
  if (!rt) return null;

  try {
    const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `cv_rt=${rt.value}` },
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
