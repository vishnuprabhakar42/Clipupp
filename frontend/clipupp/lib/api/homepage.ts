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
  activeCouponCount: number | null;
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
  verifiedAt: string | null;
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

export type HomepageCategoryTab = {
  slug: string;
  title: string;
  coupons: HomepageCouponSummary[];
};

export type HomepageCampaign = {
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
};

export type HomepageStats = {
  verifiedLast7d: number;
  activeCoupons: number;
  activeStores: number;
};

export type HomepageSectionPayload = {
  code: string;
  title: string;
  subtitle: string | null;
  itemLimit: number | null;
  stores: HomepageStoreSummary[] | null;
  coupons: HomepageCouponSummary[] | null;
  categories: HomepageCategoryItem[] | null;
  categoryTabs: HomepageCategoryTab[] | null;
  campaigns: HomepageCampaign[] | null;
};

export type HomepageLayout = { sections: HomepageSectionPayload[]; stats: HomepageStats };

export const homepageApi = {
  /**
   * Public read, anonymous, suitable for server components. Never throws:
   * a non-OK status, a network rejection or a malformed body all yield null,
   * and the page falls back to a hero built from message defaults.
   */
  getPublic: async (): Promise<HomepageLayout | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/homepage`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      });
      if (!res.ok) return null;
      return (await res.json()) as HomepageLayout;
    } catch {
      return null;
    }
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
