import type { FeedDeal } from "@/lib/home/feed";

/** schema.org Offer for a homepage feed deal (INR, numeric price). */
export function dealOfferSchema(deal: FeedDeal, store: { name: string; url?: string }): object {
  return {
    "@type": "Offer",
    name: deal.title,
    price: deal.price,
    priceCurrency: "INR",
    url: deal.url,
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: store.name, ...(store.url ? { url: store.url } : {}) },
    ...(deal.endsAt ? { priceValidUntil: deal.endsAt } : {}),
  };
}
