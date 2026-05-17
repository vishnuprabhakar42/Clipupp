import { JsonLd } from "./JsonLd";

export function CollectionPageSchema({
  url,
  name,
  description,
  itemCount,
}: {
  url: string;
  name: string;
  description?: string | null;
  itemCount?: number;
}) {
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
  return <JsonLd id="ld-collectionpage" data={data} />;
}
