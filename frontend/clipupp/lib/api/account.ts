import { apiClient } from "./client";
import type { CursorPage } from "./types";

export type ClickHistoryItem = {
  id: string;
  couponId: string;
  storeId: string;
  outboundUrl: string;
  createdAt: string;
};

export const accountApi = {
  clicks: (cursor?: string, limit = 25) => {
    const usp = new URLSearchParams();
    if (cursor) usp.append("cursor", cursor);
    usp.append("limit", String(limit));
    return apiClient.get<CursorPage<ClickHistoryItem>>(
      `/api/v1/account/clicks?${usp.toString()}`
    );
  },
};
