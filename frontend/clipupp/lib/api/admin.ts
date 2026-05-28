import { apiClient } from "./client";
import type { CursorPage } from "./types";

// ---- Stores ----------------------------------------------------------------

export type StoreStatus = "ACTIVE" | "INACTIVE" | "DELETED";

export type AdminStoreCreate = {
  name: string;
  slug?: string;
  logoUrl: string;
  description: string;
  shortDescription?: string;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  address?: string;
  primaryUrl: string;
  countryCode: string;
  popularityScore?: number;
  brandColor?: string;
  cashbackRate?: string;
  previousCashbackRate?: string;
  tagline?: string;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  topOffers?: string[];
};

export type AdminStoreUpdate = Partial<AdminStoreCreate> & { status?: StoreStatus };

export type AdminStoreSummary = {
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

export type AdminStoreDetail = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  description: string;
  shortDescription: string | null;
  rating: string | null;
  reviewCount: number;
  phone: string | null;
  address: string | null;
  primaryUrl: string;
  countryCode: string;
  status: StoreStatus;
  popularityScore: number;
  brandColor: string | null;
  cashbackRate: string | null;
  previousCashbackRate: string | null;
  tagline: string | null;
  featured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  topOffers: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

// ---- Coupons ---------------------------------------------------------------

export type CouponType = "CODE" | "DEAL" | "FREE_SHIPPING" | "IN_STORE";
export type CouponStatus = "ACTIVE" | "EXPIRED" | "HIDDEN" | "DELETED";

export type AdminCouponCreate = {
  storeId: string;
  slug?: string;
  type: CouponType;
  code?: string;
  title: string;
  description: string;
  terms?: string;
  savingsLabel?: string;
  minPurchase?: number;
  minPurchaseCurrency?: string;
  startsAt?: string;
  expiresAt?: string;
  verified?: boolean;
  exclusive?: boolean;
  popularityScore?: number;
  affiliateUrlOverride?: string;
  metaTitle?: string;
  metaDescription?: string;
  categorySlugs?: string[];
};

export type AdminCouponUpdate = Partial<Omit<AdminCouponCreate, "storeId">> & {
  status?: CouponStatus;
};

export type AdminCouponSummary = {
  id: string;
  slug: string;
  storeId: string;
  storeName: string | null;
  storeSlug: string | null;
  storeLogoUrl: string | null;
  storeBrandColor: string | null;
  type: CouponType;
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

export type AdminCouponDetail = {
  id: string;
  slug: string;
  storeId: string;
  storeName: string | null;
  storeSlug: string | null;
  type: CouponType;
  code: string | null;
  title: string;
  description: string;
  terms: string | null;
  savingsLabel: string | null;
  minPurchase: string | null;
  minPurchaseCurrency: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  status: CouponStatus;
  verified: boolean;
  exclusive: boolean;
  usedCount: number;
  clickCount: number;
  popularityScore: number;
  affiliateUrlOverride: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  categorySlugs: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

// ---- Categories ------------------------------------------------------------

export type AdminCategoryCreate = {
  title: string;
  slug?: string;
  parentId?: string;
  icon?: string;
  description?: string;
  position?: number;
  metaTitle?: string;
  metaDescription?: string;
};

export type AdminCategoryUpdate = Partial<AdminCategoryCreate> & { active?: boolean };

export type AdminCategoryDetail = {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  description: string | null;
  parentId: string | null;
  active: boolean;
  position: number;
  metaTitle: string | null;
  metaDescription: string | null;
};

// ---- Affiliate networks ----------------------------------------------------

export type AdminNetworkRow = {
  id: string;
  code: string;
  name: string;
  active: boolean;
  hasSecret: boolean;
  configJson: string;
};

export type AdminMerchantLinkRow = {
  id: string;
  storeId: string;
  networkId: string;
  advertiserId: string;
  deeplinkTemplate: string;
  priority: number;
  active: boolean;
};

// ---- Newsletter ------------------------------------------------------------

export type AdminNewsletterRow = {
  id: string;
  email: string;
  locale: string;
  status: "PENDING" | "CONFIRMED" | "UNSUBSCRIBED";
  createdAt: string;
  confirmedAt: string | null;
};

export type SpringPage<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

// ---- Users -----------------------------------------------------------------

export type Role = "USER" | "ADMIN" | "SUPER_ADMIN" | "MERCHANT";

export type AdminUserRow = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  status: "ACTIVE" | "LOCKED" | "DISABLED" | "DELETED";
  lastLoginAt: string | null;
  createdAt: string;
  roles: Role[];
};

// ---- Clicks + conversions --------------------------------------------------

export type AdminClickRow = {
  id: string;
  clickId: string;
  userId: string | null;
  couponId: string;
  storeId: string;
  networkId: string | null;
  source: string | null;
  ipInet: string | null;
  userAgent: string | null;
  outboundUrl: string;
  createdAt: string;
};

export type ConversionState = "PENDING" | "APPROVED" | "REJECTED" | "REVERSED";

export type AdminConversionRow = {
  id: string;
  clickId: string | null;
  networkId: string;
  networkTxnId: string;
  state: ConversionState;
  orderAmount: string | null;
  orderCurrency: string | null;
  commissionAmount: string | null;
  commissionCurrency: string | null;
  reportedAt: string | null;
  createdAt: string;
};

// ---- Blog + banners --------------------------------------------------------

export type AdminAuthorRow = {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type AdminArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  heroImageUrl: string | null;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "HIDDEN";
  publishedAt: string | null;
  scheduledFor: string | null;
  authorId: string;
};

export type BannerPlacement = "TOP_BAR" | "HERO_CAROUSEL" | "PROMO_CARD";

export type AdminBannerRow = {
  id: string;
  position: number;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  countryCode: string | null;
  placement?: BannerPlacement | null;
};

export type AdminBannerInput = {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl: string;
  position?: number;
  startsAt?: string;
  endsAt?: string;
  active?: boolean;
  countryCode?: string;
  placement?: BannerPlacement;
};

// ---- Client ----------------------------------------------------------------

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const adminApi = {
  // Stores
  listAdminStores: (params: {
    q?: string;
    country?: string;
    status?: StoreStatus;
    featured?: boolean;
    page?: number;
    size?: number;
  } = {}) =>
    apiClient.get<SpringPage<AdminStoreSummary>>(
      `/api/v1/admin/stores${qs(params)}`
    ),
  getStore: (id: string) =>
    apiClient.get<AdminStoreDetail>(`/api/v1/admin/stores/${id}`),
  createStore: (input: AdminStoreCreate) =>
    apiClient.post<AdminStoreSummary>("/api/v1/admin/stores", input),
  updateStore: (id: string, input: AdminStoreUpdate) =>
    apiClient.patch<AdminStoreSummary>(`/api/v1/admin/stores/${id}`, input),
  deleteStore: (id: string) => apiClient.del<void>(`/api/v1/admin/stores/${id}`),
  restoreStore: (id: string) =>
    apiClient.post<void>(`/api/v1/admin/stores/${id}/restore`),
  bulkStores: (
    action: "DEACTIVATE" | "RESTORE" | "FEATURE" | "UNFEATURE",
    ids: string[]
  ) =>
    apiClient.post<{ matched: number; updated: number }>("/api/v1/admin/stores/bulk", {
      action,
      ids,
    }),
  refreshStoreStats: (id: string) =>
    apiClient.post<unknown>(`/api/v1/admin/stores/${id}/refresh-stats`),

  // Coupons
  listAdminCoupons: (params: {
    q?: string;
    storeId?: string;
    status?: CouponStatus;
    type?: CouponType;
    page?: number;
    size?: number;
  } = {}) =>
    apiClient.get<SpringPage<AdminCouponSummary>>(
      `/api/v1/admin/coupons${qs(params)}`
    ),
  getCoupon: (id: string) =>
    apiClient.get<AdminCouponDetail>(`/api/v1/admin/coupons/${id}`),
  createCoupon: (input: AdminCouponCreate) =>
    apiClient.post<AdminCouponSummary>("/api/v1/admin/coupons", input),
  updateCoupon: (id: string, input: AdminCouponUpdate) =>
    apiClient.patch<AdminCouponSummary>(`/api/v1/admin/coupons/${id}`, input),
  deleteCoupon: (id: string) =>
    apiClient.del<void>(`/api/v1/admin/coupons/${id}`),
  restoreCoupon: (id: string) =>
    apiClient.post<void>(`/api/v1/admin/coupons/${id}/restore`),
  bulkCoupons: (
    action: "DEACTIVATE" | "RESTORE" | "VERIFY" | "UNVERIFY" | "FEATURE" | "UNFEATURE",
    ids: string[]
  ) =>
    apiClient.post<{ matched: number; updated: number }>("/api/v1/admin/coupons/bulk", {
      action,
      ids,
    }),

  // Categories
  listAdminCategories: () =>
    apiClient.get<AdminCategoryDetail[]>("/api/v1/admin/categories"),
  getCategory: (id: string) =>
    apiClient.get<AdminCategoryDetail>(`/api/v1/admin/categories/${id}`),
  createCategory: (input: AdminCategoryCreate) =>
    apiClient.post<AdminCategoryDetail>("/api/v1/admin/categories", input),
  updateCategory: (id: string, input: AdminCategoryUpdate) =>
    apiClient.patch<AdminCategoryDetail>(`/api/v1/admin/categories/${id}`, input),
  deactivateCategory: (id: string) =>
    apiClient.del<void>(`/api/v1/admin/categories/${id}`),

  // Affiliate networks
  listNetworks: () =>
    apiClient.get<AdminNetworkRow[]>("/api/v1/admin/affiliate-networks"),
  getNetwork: (id: string) =>
    apiClient.get<AdminNetworkRow>(`/api/v1/admin/affiliate-networks/${id}`),
  createNetwork: (input: {
    code: string;
    name: string;
    postbackSecret?: string;
    active?: boolean;
    configJson?: string;
  }) =>
    apiClient.post<AdminNetworkRow>("/api/v1/admin/affiliate-networks", input),
  updateNetwork: (
    id: string,
    input: { name?: string; postbackSecret?: string; active?: boolean; configJson?: string }
  ) => apiClient.patch<AdminNetworkRow>(`/api/v1/admin/affiliate-networks/${id}`, input),

  listMerchantLinks: (storeId: string) =>
    apiClient.get<AdminMerchantLinkRow[]>(
      `/api/v1/admin/merchant-network-links${qs({ storeId })}`
    ),
  getMerchantLink: (id: string) =>
    apiClient.get<AdminMerchantLinkRow>(
      `/api/v1/admin/merchant-network-links/${id}`
    ),
  createMerchantLink: (input: {
    storeId: string;
    networkId: string;
    advertiserId: string;
    deeplinkTemplate: string;
    priority?: number;
    active?: boolean;
  }) =>
    apiClient.post<AdminMerchantLinkRow>(
      "/api/v1/admin/merchant-network-links",
      input
    ),
  updateMerchantLink: (
    id: string,
    input: {
      advertiserId?: string;
      deeplinkTemplate?: string;
      priority?: number;
      active?: boolean;
    }
  ) =>
    apiClient.patch<AdminMerchantLinkRow>(
      `/api/v1/admin/merchant-network-links/${id}`,
      input
    ),
  deleteMerchantLink: (id: string) =>
    apiClient.del<void>(`/api/v1/admin/merchant-network-links/${id}`),

  // Newsletter
  listNewsletter: (page = 0, size = 50, status?: string) =>
    apiClient.get<SpringPage<AdminNewsletterRow>>(
      `/api/v1/admin/newsletter/subscribers${qs({ page, size, status })}`
    ),

  // Users
  listUsers: (page = 0, size = 50) =>
    apiClient.get<SpringPage<AdminUserRow>>(
      `/api/v1/admin/users${qs({ page, size })}`
    ),
  grantRole: (id: string, role: Role) =>
    apiClient.post<AdminUserRow>(`/api/v1/admin/users/${id}/roles`, { role }),
  revokeRole: (id: string, role: Role) =>
    apiClient.del<AdminUserRow>(`/api/v1/admin/users/${id}/roles/${role}`),
  setUserStatus: (id: string, status: AdminUserRow["status"]) =>
    apiClient.patch<AdminUserRow>(`/api/v1/admin/users/${id}/status`, { status }),

  // Clicks + conversions (read-only)
  listClicks: (page = 0, size = 50) =>
    apiClient.get<SpringPage<AdminClickRow>>(
      `/api/v1/admin/clicks${qs({ page, size })}`
    ),
  listConversions: (page = 0, size = 50) =>
    apiClient.get<SpringPage<AdminConversionRow>>(
      `/api/v1/admin/conversions${qs({ page, size })}`
    ),

  // Blog
  listAuthors: () =>
    apiClient.get<AdminAuthorRow[]>("/api/v1/admin/blog/authors"),
  getAuthor: (id: string) =>
    apiClient.get<AdminAuthorRow>(`/api/v1/admin/blog/authors/${id}`),
  createAuthor: (input: { name: string; slug?: string; bio?: string; avatarUrl?: string }) =>
    apiClient.post<AdminAuthorRow>("/api/v1/admin/blog/authors", input),
  updateAuthor: (
    id: string,
    input: { name?: string; slug?: string; bio?: string; avatarUrl?: string }
  ) => apiClient.patch<AdminAuthorRow>(`/api/v1/admin/blog/authors/${id}`, input),

  listArticles: (page = 0, size = 50, status?: string) =>
    apiClient.get<SpringPage<AdminArticleRow>>(
      `/api/v1/admin/blog/articles${qs({ page, size, status })}`
    ),
  getArticle: (id: string) =>
    apiClient.get<AdminArticleRow & { bodyMd: string; metaTitle: string | null; metaDescription: string | null }>(
      `/api/v1/admin/blog/articles/${id}`
    ),
  createArticle: (input: {
    title: string;
    slug?: string;
    excerpt: string;
    bodyMd: string;
    authorId: string;
    heroImageUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
  }) =>
    apiClient.post<AdminArticleRow>("/api/v1/admin/blog/articles", input),
  updateArticle: (
    id: string,
    input: {
      title?: string;
      slug?: string;
      excerpt?: string;
      bodyMd?: string;
      authorId?: string;
      heroImageUrl?: string;
      metaTitle?: string;
      metaDescription?: string;
    }
  ) => apiClient.patch<AdminArticleRow>(`/api/v1/admin/blog/articles/${id}`, input),
  transitionArticle: (id: string, action: string, when?: string) =>
    apiClient.post<AdminArticleRow>(
      `/api/v1/admin/blog/articles/${id}/transition`,
      { action, when }
    ),

  // Banners
  listBanners: () =>
    apiClient.get<AdminBannerRow[]>("/api/v1/admin/banners"),
  getBanner: async (id: string) => {
    const all = await apiClient.get<AdminBannerRow[]>("/api/v1/admin/banners");
    const found = all.find((b) => b.id === id);
    if (!found) throw new Error("Banner not found");
    return found;
  },
  createBanner: (input: AdminBannerInput) =>
    apiClient.post<AdminBannerRow>("/api/v1/admin/banners", input),
  updateBanner: (id: string, input: Partial<AdminBannerInput>) =>
    apiClient.patch<AdminBannerRow>(`/api/v1/admin/banners/${id}`, input),
  deleteBanner: (id: string) =>
    apiClient.del<void>(`/api/v1/admin/banners/${id}`),
  reorderBanners: (ids: string[]) =>
    apiClient.post<void>("/api/v1/admin/banners/reorder", { ids }),

  // Public-list helpers retained for code that still uses them.
  listStores: (params: { country?: string; cursor?: string; limit?: number } = {}) =>
    apiClient.get<CursorPage<{ id: string; slug: string; name: string; logoUrl: string;
      shortDescription: string | null; rating: string | null; reviewCount: number;
      countryCode: string; popularityScore: number; }>>(
      `/api/v1/stores${qs(params)}`,
      { anonymous: true }
    ),
  listCoupons: (params: { storeId?: string; cursor?: string; limit?: number } = {}) =>
    apiClient.get<CursorPage<{
      id: string; slug: string; storeId: string; type: CouponType;
      code: string | null; title: string; description: string;
      savingsLabel: string | null; expiresAt: string | null;
      verified: boolean; exclusive: boolean; usedCount: number;
      popularityScore: number; categorySlugs: string[];
    }>>(`/api/v1/coupons${qs(params)}`, { anonymous: true }),
  listCategoriesTree: () =>
    apiClient.get<Array<{
      id: string; slug: string; title: string; icon: string | null;
      description: string | null;
      children: Array<{ id: string; slug: string; title: string }>
    }>>("/api/v1/categories", { anonymous: true }),
};
