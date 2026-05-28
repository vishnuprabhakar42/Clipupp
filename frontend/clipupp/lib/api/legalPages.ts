import { apiClient } from "./client";
import { API_BASE } from "./client";

export type LegalPageDetail = {
  slug: string;
  title: string;
  bodyMd: string;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
};

export type LegalPageSummary = {
  slug: string;
  title: string;
  updatedAt: string;
};

export type LegalPageUpdate = {
  title: string;
  bodyMd: string;
  metaTitle?: string;
  metaDescription?: string;
};

export const legalPagesApi = {
  /** Public read — anonymous. */
  getPublic: async (slug: string): Promise<LegalPageDetail | null> => {
    const res = await fetch(`${API_BASE}/api/v1/legal-pages/${slug}`, {
      headers: { Accept: "application/json" },
      // Cached on the backend for 60 min via the legal.page Caffeine region;
      // also cache at the Next layer for 5 min so server-rendered legal pages
      // don't hit the API on every request.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as LegalPageDetail;
  },

  // Admin endpoints (uses the authenticated apiClient).
  listAdmin: () =>
    apiClient.get<LegalPageSummary[]>("/api/v1/admin/legal-pages"),
  getAdmin: (slug: string) =>
    apiClient.get<LegalPageDetail>(`/api/v1/admin/legal-pages/${slug}`),
  update: (slug: string, input: LegalPageUpdate) =>
    apiClient.patch<LegalPageDetail>(`/api/v1/admin/legal-pages/${slug}`, input),
};
