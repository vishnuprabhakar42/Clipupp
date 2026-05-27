import type { CouponDetail } from "@/lib/api/types";
import { offerSchema } from "./offer";

/**
 * Product schema for a coupon detail page. Google indexes Product schemas
 * with an embedded `offers` array — this is how RetailMeNot et al. rank for
 * branded "promo code" queries. Emit alongside the bare Offer schema; Google
 * picks whichever it finds most useful.
 *
 * AggregateRating is derived from the store-level rating (per the data
 * model — coupons don't have ratings; the store does). Only included when
 * the store has at least one review.
 */
export function productSchema({
  coupon,
  url,
}: {
  coupon: CouponDetail;
  url: string;
}): object {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url,
    name: coupon.title,
    description: coupon.description,
    url,
    sku: coupon.code ?? coupon.id,
    offers: offerSchema({ coupon, url }),
  };
  if (coupon.store?.logoUrl) {
    data.image = coupon.store.logoUrl;
    data.brand = {
      "@type": "Brand",
      name: coupon.store.name,
      logo: coupon.store.logoUrl,
    };
  }
  // NOTE: aggregateRating intentionally omitted — the CouponDetail.store
  // shape doesn't include rating/reviewCount. To add it we'd need a separate
  // store fetch on the coupon-detail page; left for a follow-up.
  return data;
}
