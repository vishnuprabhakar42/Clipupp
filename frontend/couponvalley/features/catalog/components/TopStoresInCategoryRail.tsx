import { categoriesApi } from "@/lib/api/categories";
import { RelatedStoresRail } from "./RelatedStoresRail";

type TopStore = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  cashbackRate?: string | null;
};

/**
 * Server-fetches top-N stores in a category via /api/v1/categories/{slug}/top-stores
 * and renders them in the shared RelatedStoresRail. Returns null when no
 * stores resolve (so the section disappears entirely rather than leaving
 * an empty heading). Used on category detail pages.
 */
export async function TopStoresInCategoryRail({
  slug,
  categoryTitle,
  limit = 8,
}: {
  slug: string;
  categoryTitle: string;
  limit?: number;
}) {
  let stores: TopStore[] = [];
  try {
    const data = await categoriesApi.topStores(slug, limit);
    stores = (data ?? []) as TopStore[];
  } catch {
    return null;
  }
  if (stores.length === 0) return null;

  return (
    <RelatedStoresRail
      heading={`Top ${categoryTitle} stores`}
      subheading="Brands shoppers reach for first in this category."
      stores={stores.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        logoUrl: s.logoUrl,
        cashbackRate: s.cashbackRate,
      }))}
    />
  );
}
