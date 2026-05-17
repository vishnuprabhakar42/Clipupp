import { apiClient } from "./client";
import type {
  CouponSummary,
  CursorPage,
  StoreDetail,
  StoreSummary,
} from "./types";

export type StoreListParams = {
  country?: string;
  category?: string;
  cursor?: string;
  limit?: number;
};

function qs(params: Record<string, string | number | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const storesApi = {
  list: (params: StoreListParams = {}) =>
    apiClient.get<CursorPage<StoreSummary>>(`/api/v1/stores${qs(params)}`, {
      anonymous: true,
    }),

  bySlug: (slug: string) =>
    apiClient.get<StoreDetail>(
      `/api/v1/stores/${encodeURIComponent(slug)}`,
      { anonymous: true }
    ),

  coupons: (slug: string, page = 0, size = 24) =>
    apiClient.get<CursorPage<CouponSummary>>(
      `/api/v1/stores/${encodeURIComponent(slug)}/coupons${qs({ page, size })}`,
      { anonymous: true }
    ),

  similar: (slug: string, limit = 8) =>
    apiClient.get<StoreSummary[]>(
      `/api/v1/stores/${encodeURIComponent(slug)}/similar${qs({ limit })}`,
      { anonymous: true }
    ),
};
