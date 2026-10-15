// Hand-written DTOs that mirror the backend response shapes.
// Sprint 5+ swaps these for openapi-typescript-generated types once the
// catalog endpoints are stable.

export type ApiProblem = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code: string;
  traceId?: string;
  errors?: Array<{ field: string; code: string; message: string }>;
};

export type Role = "USER" | "ADMIN" | "SUPER_ADMIN" | "MERCHANT";

export type UserSummary = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  imageUrl: string | null;
  locale: string;
  roles: Role[];
};

export type AuthResponse = {
  accessToken: string;
  accessTokenTtlSeconds: number;
  user: UserSummary | null;
};

export type Preference = {
  preferredCurrency: string;
  emailOptIn: boolean;
  weeklyDigestOptIn: boolean;
  marketingOptIn: boolean;
};

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  locale?: string;
};

export type LoginInput = { email: string; password: string };

export type ChangePasswordInput = { currentPassword: string; newPassword: string };

export type UpdateProfileInput = { name?: string; imageUrl?: string; locale?: string };

export type UpdatePreferencesInput = Partial<Preference>;

// ---- Catalog ---------------------------------------------------------------

export type CursorPage<T> = {
  data: T[];
  page: { nextCursor: string | null; hasMore: boolean; limit: number };
};

export type CouponType = "CODE" | "DEAL" | "FREE_SHIPPING" | "IN_STORE";
export type CouponStatus = "ACTIVE" | "EXPIRED" | "HIDDEN" | "DELETED";

export type StoreSummary = {
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
  /** Active coupons; null when the endpoint did not compute it. */
  activeCouponCount: number | null;
};

export type StoreDetail = {
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
  popularityScore: number;
  metaTitle: string | null;
  metaDescription: string | null;
  topOffers: string[];
  stats: {
    totalOffers: number;
    couponCodes: number;
    inStoreCoupons: number;
    freeShippingDeals: number;
  } | null;
  contentWriter: {
    name: string;
    role: string;
    bio: string;
    imageUrl: string | null;
  } | null;
  faqs: Array<{
    id: string;
    position: number;
    question: string;
    answer: string;
  }>;
  featuredArticles: Array<{
    id: string;
    position: number;
    title: string;
    description: string;
    url: string | null;
    author: string | null;
  }>;
};

export type CouponSummary = {
  id: string;
  slug: string;
  storeId: string;
  /** Store info — populated by /coupons/top, may be null on other endpoints. */
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
  verifiedAt: string | null;
  exclusive: boolean;
  usedCount: number;
  popularityScore: number;
  categorySlugs: string[];
};

export type CouponDetail = {
  id: string;
  slug: string;
  type: CouponType;
  status: CouponStatus;
  code: string | null;
  title: string;
  description: string;
  terms: string | null;
  savingsLabel: string | null;
  minPurchase: string | null;
  minPurchaseCurrency: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  verified: boolean;
  verifiedAt: string | null;
  exclusive: boolean;
  usedCount: number;
  popularityScore: number;
  metaTitle: string | null;
  metaDescription: string | null;
  categorySlugs: string[];
  store: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string;
    primaryUrl: string;
  } | null;
};

export type CategoryNode = {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  description: string | null;
  children: CategoryNode[];
};

export type CategoryDetail = {
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

export type SearchHit = {
  id: string;
  slug: string;
  title: string;
  snippet: string | null;
  imageUrl: string | null;
  kind: "STORE" | "COUPON" | "CATEGORY";
  rank: number;
};

export type SearchResults = {
  stores: SearchHit[];
  coupons: SearchHit[];
  categories: SearchHit[];
};
