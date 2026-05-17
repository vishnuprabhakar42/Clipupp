import { apiClient, API_BASE } from "./client";

export type HomepageSection = {
  id: string;
  code: string;
  title: string;
  subtitle: string | null;
  enabled: boolean;
  position: number;
  itemLimit: number | null;
  config: string;
  updatedAt: string;
};

export type HomepageSectionUpdate = {
  title?: string;
  subtitle?: string;
  enabled?: boolean;
  itemLimit?: number;
  config?: string;
};

export type FeaturedType = "stores" | "coupons" | "categories";

export type FeaturedItem = {
  slug: string;
  title: string;
  imageUrl: string | null;
};

export type FeaturedAssignment = { slug: string; position: number };

// ---- Public layout (resolved single-shot) ---------------------------------

export type HomepageStoreSummary = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  shortDescription: string | null;
  rating: string | null;
  reviewCount: number;
  countryCode: string;
  popularityScore: number;
  brandColor: string | null;
  cashbackRate: string | null;
  previousCashbackRate: string | null;
  tagline: string | null;
  featured: boolean;
};

export type HomepageCouponSummary = {
  id: string;
  slug: string;
  storeId: string;
  storeName: string | null;
  storeSlug: string | null;
  storeLogoUrl: string | null;
  storeBrandColor: string | null;
  type: "CODE" | "DEAL" | "FREE_SHIPPING" | "IN_STORE";
  code: string | null;
  title: string;
  description: string;
  savingsLabel: string | null;
  expiresAt: string | null;
  verified: boolean;
  exclusive: boolean;
  usedCount: number;
  popularityScore: number;
  categorySlugs: string[];
};

export type HomepageCategoryItem = {
  slug: string;
  title: string;
  icon: string | null;
};

export type HomepageSectionPayload = {
  code: string;
  title: string;
  subtitle: string | null;
  itemLimit: number | null;
  stores: HomepageStoreSummary[] | null;
  coupons: HomepageCouponSummary[] | null;
  categories: HomepageCategoryItem[] | null;
};

export type HomepageLayout = { sections: HomepageSectionPayload[] };

export const homepageApi = {
  /** Public read — anonymous, suitable for server components. */
  getPublic: async (): Promise<HomepageLayout | null> => {
    const res = await fetch(`${API_BASE}/api/v1/homepage`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as HomepageLayout;
  },

  // Admin
  listSections: () =>
    apiClient.get<HomepageSection[]>("/api/v1/admin/homepage/sections"),
  updateSection: (id: string, input: HomepageSectionUpdate) =>
    apiClient.patch<HomepageSection>(
      `/api/v1/admin/homepage/sections/${id}`,
      input
    ),
  reorderSections: (ids: string[]) =>
    apiClient.post<void>("/api/v1/admin/homepage/sections/reorder", { ids }),

  listFeatured: (type: FeaturedType) =>
    apiClient.get<FeaturedItem[]>(`/api/v1/admin/homepage/featured/${type}`),
  setFeatured: (type: FeaturedType, items: FeaturedAssignment[]) =>
    apiClient.post<void>(`/api/v1/admin/homepage/featured/${type}`, { items }),
};
