import type { CouponDetail } from "@/lib/api/types";

export function offerSchema({
  coupon,
  url,
}: {
  coupon: CouponDetail;
  url: string;
}): object {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Offer",
    "@id": url,
    name: coupon.title,
    description: coupon.description,
    url,
    availability:
      coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
    category:
      coupon.type === "FREE_SHIPPING"
        ? "Free Shipping"
        : coupon.type === "IN_STORE"
          ? "In-Store"
          : coupon.type === "DEAL"
            ? "Deal"
            : "Promo Code",
  };
  if (coupon.startsAt) data.validFrom = coupon.startsAt;
  if (coupon.expiresAt) data.validThrough = coupon.expiresAt;
  if (coupon.minPurchase && coupon.minPurchaseCurrency) {
    data.eligibleTransactionVolume = {
      "@type": "PriceSpecification",
      price: coupon.minPurchase,
      priceCurrency: coupon.minPurchaseCurrency,
    };
  }
  if (coupon.store) {
    data.offeredBy = {
      "@type": "Organization",
      name: coupon.store.name,
      url: coupon.store.primaryUrl,
    };
    data.image = coupon.store.logoUrl;
  }
  if (coupon.code) {
    data.priceSpecification = {
      "@type": "PriceSpecification",
      price: 0,
      priceCurrency: "USD",
    };
  }
  return data;
}
