import { apiClient, API_BASE } from "./client";

export type CampaignSummary = {
  id: string;
  slug: string;
  name: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

export type CampaignDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  active: boolean;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  themeColor: string | null;
  bannerId: string | null;
  pinnedStoreIds: string[];
  pinnedCouponIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CampaignCreate = {
  name: string;
  slug?: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  active?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  themeColor?: string;
  bannerId?: string;
  pinnedStoreIds?: string[];
  pinnedCouponIds?: string[];
};

export type CampaignUpdate = Partial<CampaignCreate>;

export const campaignsApi = {
  /** Public read — anonymous, returns null when no campaign is active. */
  getActive: async (): Promise<CampaignDetail | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/campaigns/active`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      });
      if (res.status === 204 || !res.ok) return null;
      return (await res.json()) as CampaignDetail;
    } catch {
      return null;
    }
  },

  // Admin
  listAdmin: () => apiClient.get<CampaignSummary[]>("/api/v1/admin/campaigns"),
  getAdmin: (id: string) => apiClient.get<CampaignDetail>(`/api/v1/admin/campaigns/${id}`),
  create: (input: CampaignCreate) =>
    apiClient.post<CampaignDetail>("/api/v1/admin/campaigns", input),
  update: (id: string, input: CampaignUpdate) =>
    apiClient.patch<CampaignDetail>(`/api/v1/admin/campaigns/${id}`, input),
  activate: (id: string) =>
    apiClient.post<CampaignDetail>(`/api/v1/admin/campaigns/${id}/activate`, {}),
  delete: (id: string) => apiClient.del<void>(`/api/v1/admin/campaigns/${id}`),
};
