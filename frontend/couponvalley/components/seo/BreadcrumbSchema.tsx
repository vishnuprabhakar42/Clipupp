import { JsonLd } from "./JsonLd";

export type Crumb = { name: string; url: string };

export function BreadcrumbSchema({ items, id }: { items: Crumb[]; id?: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
  return <JsonLd id={id ?? "ld-breadcrumb"} data={data} />;
}
