export type ItemListEntry = { url: string; name: string };

/**
 * ItemList schema for listing pages (/coupons, /offers, /stores,
 * /categories/[slug], /blog). Tells Google the page is a list of items and
 * declares the order — helps rich-result eligibility for "best of" carousels.
 *
 * Cap `entries` at the visible page size (typically 20-30); don't dump all
 * 10k coupons in here, that's what the sitemap is for.
 */
export function itemListSchema({
  url,
  name,
  entries,
}: {
  url: string;
  name: string;
  entries: ItemListEntry[];
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": url,
    name,
    numberOfItems: entries.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: entries.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: e.url,
      name: e.name,
    })),
  };
}
