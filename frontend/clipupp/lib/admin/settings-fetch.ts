import { adminFetch } from "@/lib/admin/server-fetch";
import type { SettingDetail } from "@/lib/api/settings";

/**
 * Server-side fetch of all admin-visible site settings, returned as a plain
 * key → value map for forms to read defaults from.
 */
export async function fetchAdminSettings(): Promise<Record<string, unknown>> {
  const list = (await adminFetch<SettingDetail[]>("/api/v1/admin/settings")) ?? [];
  const map: Record<string, unknown> = {};
  for (const s of list) map[s.key] = s.value;
  return map;
}
