import { apiClient, API_BASE } from "./client";

export type SettingDetail = {
  key: string;
  value: unknown;
  updatedAt: string;
};

/**
 * Public settings — server-side cached for 5 min on top of the backend's
 * 10-min Caffeine TTL. Returns an empty object if the API is unreachable so
 * server components don't crash on a cold backend.
 */
export async function getPublicSettings(): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/settings/public`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export const settingsApi = {
  getPublicSettings,
  listAdmin: () => apiClient.get<SettingDetail[]>("/api/v1/admin/settings"),
  set: (key: string, value: unknown) =>
    apiClient.patch<SettingDetail>(
      `/api/v1/admin/settings/${encodeURIComponent(key)}`,
      { value }
    ),
  bulkSet: (values: Record<string, unknown>) =>
    apiClient.post<SettingDetail[]>("/api/v1/admin/settings/bulk", { values }),
};

/**
 * Helper to coerce an unknown JSON value to a string (used by the form code
 * that always wants string fallbacks for inputs).
 */
export function asString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  return String(v);
}
