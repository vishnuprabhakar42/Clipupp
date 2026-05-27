import { storesApi } from "@/lib/api/stores";
import { categoriesApi } from "@/lib/api/categories";
import { AnnouncementBar } from "@/features/home/components/AnnouncementBar";
import { HeaderClient, type NavStore, type NavCategory } from "./HeaderClient";

/**
 * Header — server wrapper. Fetches nav data (top stores + category tree)
 * server-side via the same cached backend endpoints used elsewhere, then
 * hands them to HeaderClient for the interactive shell. The announcement
 * bar above it is also a server component (cookie-gated dismissal via a
 * server action).
 *
 * This split means the header no longer pulls React Query into the client
 * bundle for nav data — the data is in the SSR HTML and the client island
 * just hydrates the interactivity (scroll-shadow, mobile drawer, dropdowns,
 * scroll arrows).
 */
export async function Header() {
  const [stores, categories] = await Promise.all([safeStores(), safeCategories()]);
  return (
    <>
      <AnnouncementBar />
      <HeaderClient stores={stores} categories={categories} />
    </>
  );
}

async function safeStores(): Promise<NavStore[]> {
  try {
    const page = await storesApi.list({ limit: 18 });
    return ((page.data ?? []) as NavStore[]).map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      logoUrl: s.logoUrl,
    }));
  } catch {
    return [];
  }
}

async function safeCategories(): Promise<NavCategory[]> {
  try {
    const tree = await categoriesApi.tree();
    return (tree ?? []).map((c) => ({ id: c.id, slug: c.slug, title: c.title }));
  } catch {
    return [];
  }
}
