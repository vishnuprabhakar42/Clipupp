import type { CouponSummary } from "@/lib/api/types";
import { badgeFor } from "@/lib/format/badge";
import type { FeedCoupon } from "./feed";

export type CouponSummaryLike = Pick<
  CouponSummary,
  | "id"
  | "slug"
  | "storeId"
  | "storeSlug"
  | "title"
  | "description"
  | "code"
  | "savingsLabel"
  | "verifiedAt"
  | "usedCount"
  | "exclusive"
  | "expiresAt"
  | "categorySlugs"
>;

/**
 * Map a backend coupon summary into the homepage `FeedCoupon`.
 * `storeSlug` overrides the summary's own slug (list endpoints leave it null
 * and only carry `storeId`).
 */
export function toFeedCoupon(c: CouponSummaryLike, trending: number | null = null, storeSlug?: string | null): FeedCoupon {
  return {
    id: c.id,
    store: storeSlug ?? c.storeSlug ?? c.storeId,
    title: c.title,
    terms: c.description,
    code: c.code,
    badge: badgeFor({ savingsLabel: c.savingsLabel, title: c.title, code: c.code }),
    verifiedAt: c.verifiedAt,
    success: null,
    uses: c.usedCount,
    exclusive: c.exclusive,
    trending,
    expiresAt: c.expiresAt,
    cat: c.categorySlugs[0] ?? null,
    slug: c.slug,
  };
}
