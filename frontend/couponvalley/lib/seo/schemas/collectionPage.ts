export function collectionPageSchema({
  url,
  name,
  description,
  itemCount,
}: {
  url: string;
  name: string;
  description?: string | null;
  itemCount?: number;
}): object {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    url,
    name,
  };
  if (description) data.description = description;
  if (typeof itemCount === "number") {
    data.mainEntity = {
      "@type": "ItemList",
      numberOfItems: itemCount,
    };
  }
  return data;
}
