import { apiClient } from "./client";
import type { SearchHit, SearchResults } from "./types";

export const searchApi = {
  full: (query: string, type?: "all" | "store" | "coupon" | "category", country?: string) => {
    const usp = new URLSearchParams({ q: query });
    if (type) usp.append("type", type);
    if (country) usp.append("country", country);
    return apiClient.get<SearchResults>(`/api/v1/search?${usp.toString()}`, {
      anonymous: true,
    });
  },

  suggest: (query: string, country?: string) => {
    const usp = new URLSearchParams({ q: query });
    if (country) usp.append("country", country);
    return apiClient.get<SearchHit[]>(
      `/api/v1/search/suggest?${usp.toString()}`,
      { anonymous: true }
    );
  },
};
