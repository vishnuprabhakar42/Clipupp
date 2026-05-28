import type { MetadataRoute } from "next";

/**
 * The frontend's `/sitemap.xml` delegates to the backend, which knows the
 * canonical list of stores/coupons/categories and assembles the sitemap
 * index (with hreflang alternates) directly from Postgres. Keeping a single
 * source of truth avoids drift between the two services.
 *
 * Next.js will fetch this URL and emit an `index` sitemap that includes the
 * backend index URL as its only child sitemap reference, so search engines
 * follow through to the per-type sitemaps.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  return [
    {
      url: `${apiBase}/sitemap.xml`,
      lastModified: new Date(),
    },
  ];
}
