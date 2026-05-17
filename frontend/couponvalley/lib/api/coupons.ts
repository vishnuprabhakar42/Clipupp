import { apiClient } from "./client";
import type {
  CouponDetail,
  CouponSummary,
  CouponType,
  CursorPage,
} from "./types";

export type CouponListParams = {
  storeId?: string;
  types?: CouponType[];
  category?: string;
  cursor?: string;
  limit?: number;
};

function qs(params: CouponListParams): string {
  const usp = new URLSearchParams();
  if (params.storeId) usp.append("storeId", params.storeId);
  if (params.category) usp.append("category", params.category);
  if (params.cursor) usp.append("cursor", params.cursor);
  if (params.limit !== undefined) usp.append("limit", String(params.limit));
  if (params.types && params.types.length > 0) {
    for (const t of params.types) usp.append("types", t);
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const couponsApi = {
  list: (params: CouponListParams = {}) =>
    apiClient.get<CursorPage<CouponSummary>>(
      `/api/v1/coupons${qs(params)}`,
      { anonymous: true }
    ),

  bySlug: (slug: string) =>
    apiClient.get<CouponDetail>(
      `/api/v1/coupons/${encodeURIComponent(slug)}`,
      { anonymous: true }
    ),

  top: (limit = 12) =>
    apiClient.get<CouponSummary[]>(`/api/v1/coupons/top?limit=${limit}`, {
      anonymous: true,
    }),
};

export const offersApi = {
  list: (params: { category?: string; cursor?: string; limit?: number } = {}) => {
    const usp = new URLSearchParams();
    if (params.category) usp.append("category", params.category);
    if (params.cursor) usp.append("cursor", params.cursor);
    if (params.limit) usp.append("limit", String(params.limit));
    const s = usp.toString();
    return apiClient.get<CursorPage<CouponSummary>>(
      `/api/v1/offers${s ? `?${s}` : ""}`,
      { anonymous: true }
    );
  },

  bySlug: (slug: string) =>
    apiClient.get<CouponDetail>(
      `/api/v1/offers/${encodeURIComponent(slug)}`,
      { anonymous: true }
    ),
};
