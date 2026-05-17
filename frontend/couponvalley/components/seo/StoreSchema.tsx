import { JsonLd } from "./JsonLd";
import type { StoreDetail } from "@/lib/api/types";

export function StoreSchema({
  store,
  url,
}: {
  store: StoreDetail;
  url: string;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": url,
    name: store.name,
    url,
    logo: store.logoUrl,
    image: store.logoUrl,
    description: store.shortDescription ?? store.description.slice(0, 280),
    sameAs: [store.primaryUrl],
  };
  if (store.rating && store.reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: store.rating,
      reviewCount: store.reviewCount,
    };
  }
  if (store.address) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: store.address,
      addressCountry: store.countryCode,
    };
  }
  if (store.phone) {
    data.telephone = store.phone;
  }
  return <JsonLd id="ld-store" data={data} />;
}
