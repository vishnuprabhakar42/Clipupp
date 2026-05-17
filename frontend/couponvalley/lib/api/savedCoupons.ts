import { apiClient } from "./client";
import type { CursorPage } from "./types";

export type SavedCouponItem = {
  couponId: string;
  savedAt: string;
  couponSlug: string | null;
  couponTitle: string | null;
  savingsLabel: string | null;
  couponStatus: string | null;
  storeId: string | null;
};

export const savedCouponsApi = {
  list: (cursor?: string, limit = 24) => {
    const usp = new URLSearchParams();
    if (cursor) usp.append("cursor", cursor);
    usp.append("limit", String(limit));
    return apiClient.get<CursorPage<SavedCouponItem>>(
      `/api/v1/account/saved-coupons?${usp.toString()}`
    );
  },

  save: (couponId: string) =>
    apiClient.post<void>("/api/v1/account/saved-coupons", { couponId }),

  unsave: (couponId: string) =>
    apiClient.del<void>(
      `/api/v1/account/saved-coupons/${encodeURIComponent(couponId)}`
    ),
};
