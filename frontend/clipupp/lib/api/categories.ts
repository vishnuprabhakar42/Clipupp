import { apiClient } from "./client";
import type {
  CategoryDetail,
  CategoryNode,
  CouponSummary,
  CursorPage,
  StoreSummary,
} from "./types";

export const categoriesApi = {
  tree: () =>
    apiClient.get<CategoryNode[]>("/api/v1/categories", { anonymous: true }),

  bySlug: (slug: string) =>
    apiClient.get<CategoryDetail>(
      `/api/v1/categories/${encodeURIComponent(slug)}`,
      { anonymous: true }
    ),

  coupons: (slug: string, cursor?: string, limit = 24) => {
    const usp = new URLSearchParams();
    if (cursor) usp.append("cursor", cursor);
    usp.append("limit", String(limit));
    return apiClient.get<CursorPage<CouponSummary>>(
      `/api/v1/categories/${encodeURIComponent(slug)}/coupons?${usp.toString()}`,
      { anonymous: true }
    );
  },

  /** Top-N stores in a category by popularity. Used by the
   *  TopStoresInCategoryRail on category detail pages (Phase 3). */
  topStores: (slug: string, limit = 8) =>
    apiClient.get<StoreSummary[]>(
      `/api/v1/categories/${encodeURIComponent(slug)}/top-stores?limit=${limit}`,
      { anonymous: true }
    ),
};
