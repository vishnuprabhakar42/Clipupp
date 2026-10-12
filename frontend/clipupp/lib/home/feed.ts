/**
 * Typed contract the v3 homepage renders from. The backend layout is adapted
 * into this shape by `lib/home/adapter.ts`; `store` ids are store slugs and
 * `cat` ids are category slugs.
 */

export type FeedCategory = {
  /** Category slug. */
  id: string;
  /** Display name. */
  name: string;
  /** Lucide icon name (see `lib/home/categoryIcon.ts`). */
  icon: string;
  /** Parent category slug; null for a root. Undefined when the source has no hierarchy info. */
  parent?: string | null;
  /** Marks a seasonal category that gets the hot treatment. */
  hot?: boolean;
  /** "fixture" for demo-only categories the backend does not know; absent means "api". */
  source?: "api" | "fixture";
  /** Number of coupons shown for the category. */
  couponCount: number;
  /** Up to three stores to name-drop in the mega menu. */
  topStores: { slug: string; name: string }[];
};

export type FeedStore = {
  /** Store slug. */
  id: string;
  /** Display name. */
  name: string;
  /** Logo path or URL, null when a monogram tile is used. */
  logo: string | null;
  /** Monogram letters for the fallback tile. */
  mono: string;
  /** Monogram tile background colour. */
  bg: string;
  /** Monogram tile text colour. */
  fg: string;
  /** Category slug the store sits in, when known. */
  cat: string | null;
  /** Store homepage for outbound links, when known. */
  url: string | null;
  /** Active coupon count for the store. */
  coupons: number;
  /** Deal label such as "Up to 7% extra". */
  best: string | null;
  /** Popularity rank starting at 1, null when unranked. */
  popular: number | null;
};

export type FeedCoupon = {
  /** Coupon id. */
  id: string;
  /** Store slug. */
  store: string;
  /** Headline. */
  title: string;
  /** Conditions line. */
  terms: string;
  /** Code to copy, null for no-code deals. */
  code: string | null;
  /** Short discount chip such as "12%" or "₹500", derived with `badgeFor`. */
  badge: string;
  /** ISO time of the last verification. */
  verifiedAt: string | null;
  /** Success rate percent, null when not tracked. */
  success: number | null;
  /** Times used. */
  uses: number;
  /** Only on Clipupp. */
  exclusive: boolean;
  /** Trending rank starting at 1, null when not trending. */
  trending: number | null;
  /** ISO expiry time. */
  expiresAt: string | null;
  /** Category slug, first one on the coupon. */
  cat: string | null;
  /** Coupon slug for the detail route. */
  slug: string;
};

export type FeedSpotlight = {
  /** Store slug the offer belongs to. */
  store: string;
  /** Small label above the title. */
  kicker: string;
  /** Status flag such as "Live now", null for none. */
  flag: string | null;
  /** Headline. */
  title: string;
  /** Supporting sentence. */
  text: string;
  /** Short bullet perks. */
  perks: string[];
  /** ISO end time. */
  endsAt: string | null;
  /** Coupon to open from the call to action. */
  couponId: string | null;
};

export type FeedDeal = {
  /** Deal id. */
  id: string;
  /** Store slug. */
  store: string;
  /** Product title. */
  title: string;
  /** Current price in rupees. */
  price: number;
  /** Original price in rupees. */
  mrp: number | null;
  /** Product image URL. */
  image: string | null;
  /** Outbound product URL. */
  url: string;
  /** Star rating 0-5. */
  rating: number | null;
  /** Review count. */
  reviews: number | null;
  /** Category slug. */
  cat: string | null;
  /** ISO end time. */
  endsAt: string | null;
  /** True when this is the lowest price in 30 days. */
  lowest30d: boolean;
  /** Percent off, 0 when unknown. */
  off: number;
};

export type FeedBankOffer = {
  /** Offer id. */
  id: string;
  /** Bank name. */
  bank: string;
  /** Card gradient colours. */
  art: [string, string];
  /** Store slug. */
  store: string;
  /** Headline. */
  title: string;
  /** Conditions line. */
  terms: string;
};

export type FeedSale = {
  /** Sale id. */
  id: string;
  /** Store slug. */
  store: string;
  /** Sale name. */
  name: string;
  /** ISO start time. */
  startAt: string;
  /** ISO end time. */
  endAt: string;
  /** Short description. */
  text: string;
};

export type FeedStats = {
  /** Codes verified recently (backend only reports the last 7 days, used as a proxy for today). */
  verifiedToday: number;
  /** Percent of codes that worked in the last 7 days, null when not tracked. */
  successRate7d: number | null;
  /** Active store count. */
  storeCount: number;
  /** Active coupon count. */
  activeCoupons: number;
};

export type HomeFeed = {
  /** ISO time the feed was built. */
  generatedAt: string;
  /** True when fixture data may have been mixed in. */
  demo: boolean;
  /** Headline numbers. */
  stats: FeedStats;
  /** Category rail and mega menu. */
  categories: FeedCategory[];
  /** Stores for chips, grid and lookups. */
  stores: FeedStore[];
  /** Hero carousel offers. */
  spotlight: FeedSpotlight[];
  /** Coupons for ticker, trending and the main list. */
  coupons: FeedCoupon[];
  /** Live product deals. */
  deals: FeedDeal[];
  /** Bank and card offers. */
  bankOffers: FeedBankOffer[];
  /** Sale calendar entries. */
  sales: FeedSale[];
  /** Bank names for the offer filter. */
  banks: string[];
  /** Festival for the announcement strip, null when none. */
  festival: { name: string; date: string } | null;
  /** FAQ entries. */
  faq: { q: string; a: string }[];
  /** Footer popular searches. */
  popularSearches: { label: string; href: string }[];
  /** Telegram bot username, null when not configured. */
  telegramBot: string | null;
  /** Section codes in render order. */
  sectionOrder: string[];
};
