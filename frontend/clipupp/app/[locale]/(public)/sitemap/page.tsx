import type { Metadata } from "next";
import { Link } from "@/lib/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { storesApi } from "@/lib/api/stores";
import { categoriesApi } from "@/lib/api/categories";
import { buildMetadata } from "@/lib/seo/meta";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 600; // 10 min — refreshed when the catalog grows.

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: "Site map — All stores & categories",
    description:
      "Browse every store and category on Clipupp. The full directory in one place — useful for finding less-popular brands quickly.",
    path: "/sitemap",
    locale,
  });
}

type StoreEntry = { slug: string; name: string };
type CategoryEntry = { slug: string; title: string };

/**
 * User-facing HTML sitemap. Lists every store grouped A-Z + every category
 * tree. This is the single strongest internal-linking SEO move for a coupon
 * site: Googlebot crawls it once and discovers every URL we'd otherwise need
 * a million pageviews + manual link-builds to surface. Users tolerate it
 * because it's a useful directory; SEO tools love it.
 *
 * Server-rendered, cached for 10 minutes. Walks the storesApi cursor a few
 * times to gather up to ~500 stores — enough for Phase 1 catalog scale; we
 * switch to per-letter routes (/stores/letter/{a-z}) once we cross 500.
 */
export default async function HtmlSitemapPage({
  params,
}: {
  params: Params;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [stores, categories] = await Promise.all([
    loadAllStores(500),
    loadCategoryTree(),
  ]);

  const byLetter = groupStoresByLetter(stores);
  const letters = Array.from(byLetter.keys()).sort();

  return (
    <div className="clipupp-container clipupp-section">
      <header className="mx-auto max-w-3xl text-center">
        <p className="clipupp-tag bg-transparent px-0 text-clipupp-primary">Site map</p>
        <h1 className="clipupp-h1 mt-3">All stores & categories</h1>
        <p className="clipupp-body mx-auto mt-3 max-w-xl text-clipupp-neutral-600">
          Every brand and category we cover, in one place. Use the letter
          shortcuts below to jump to a store.
        </p>
      </header>

      <section aria-labelledby="categories-section" className="mt-12">
        <h2 id="categories-section" className="clipupp-h2">
          Categories
        </h2>
        {categories.length === 0 ? (
          <p className="clipupp-meta mt-2">No categories available right now.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-y-2 gap-x-6 text-sm md:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="text-clipupp-neutral-700 hover:text-clipupp-primary hover:underline"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="stores-section" className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="stores-section" className="clipupp-h2">
            Stores ({stores.length})
          </h2>
          {letters.length > 0 && (
            <nav aria-label="Jump to letter" className="hidden flex-wrap gap-1 sm:flex">
              {letters.map((L) => (
                <a
                  key={L}
                  href={`#letter-${L}`}
                  className="grid h-7 w-7 place-items-center rounded text-xs font-semibold text-clipupp-neutral-600 hover:bg-clipupp-primary-soft hover:text-clipupp-primary"
                >
                  {L}
                </a>
              ))}
            </nav>
          )}
        </div>

        {stores.length === 0 ? (
          <p className="clipupp-meta mt-2">No stores available right now.</p>
        ) : (
          <div className="mt-6 space-y-8">
            {letters.map((L) => {
              const items = byLetter.get(L)!;
              return (
                <div key={L} id={`letter-${L}`} className="scroll-mt-24">
                  <h3 className="clipupp-h3 border-b border-clipupp-neutral-200 pb-2 text-clipupp-primary">
                    {L}
                  </h3>
                  <ul className="mt-3 grid grid-cols-2 gap-y-1 gap-x-6 text-sm md:grid-cols-3 lg:grid-cols-4">
                    {items.map((s) => (
                      <li key={s.slug}>
                        <Link
                          href={`/stores/${s.slug}`}
                          className="text-clipupp-neutral-700 hover:text-clipupp-primary hover:underline"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

async function loadAllStores(maxCount: number): Promise<StoreEntry[]> {
  const out: StoreEntry[] = [];
  let cursor: string | undefined;
  // Walk up to ~5 cursor pages (5 * 100 = 500). Once the catalog grows past
  // this, switch the page to /stores/letter/{a-z} routes so each letter
  // can be statically pre-rendered independently.
  for (let i = 0; i < 5; i++) {
    try {
      const page = await storesApi.list({ cursor, limit: 100 });
      for (const s of page.data ?? []) {
        out.push({ slug: s.slug, name: s.name });
        if (out.length >= maxCount) return out;
      }
      cursor = page.page.nextCursor ?? undefined;
      if (!cursor) break;
    } catch {
      break;
    }
  }
  return out;
}

async function loadCategoryTree(): Promise<CategoryEntry[]> {
  try {
    const tree = await categoriesApi.tree();
    const flat: CategoryEntry[] = [];
    for (const node of tree ?? []) {
      flat.push({ slug: node.slug, title: node.title });
      for (const child of node.children ?? []) {
        flat.push({ slug: child.slug, title: `  · ${child.title}` });
      }
    }
    return flat;
  } catch {
    return [];
  }
}

function groupStoresByLetter(stores: StoreEntry[]): Map<string, StoreEntry[]> {
  const map = new Map<string, StoreEntry[]>();
  // Stable alphabetical sort first so the per-letter ordering is consistent.
  const sorted = [...stores].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
  for (const s of sorted) {
    const ch = s.name.trim().charAt(0).toUpperCase();
    const key = /[A-Z]/.test(ch) ? ch : "#";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return map;
}
