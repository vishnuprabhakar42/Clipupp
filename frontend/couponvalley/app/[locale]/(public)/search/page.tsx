import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { searchApi } from "@/lib/api/search";
import { isApiError } from "@/lib/api/errors";

// Search results pages are intentionally not indexed (duplicate-content risk).
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

type SearchParams = Promise<{ q?: string; type?: "all" | "store" | "coupon" | "category" }>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const type = sp.type ?? "all";

  if (!q) {
    return (
      <div className="container py-12">
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="mt-2 text-muted-foreground">
          Try searching for a brand, a category, or an offer keyword from the header.
        </p>
      </div>
    );
  }

  let results: Awaited<ReturnType<typeof searchApi.full>> = {
    stores: [],
    coupons: [],
    categories: [],
  };
  let hadError = false;
  try {
    results = await searchApi.full(q, type);
  } catch (err) {
    hadError = !(isApiError(err) && err.status === 404);
  }

  const total = results.stores.length + results.coupons.length + results.categories.length;

  return (
    <div className="container py-8 md:py-12">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-2xl font-semibold md:text-3xl">
          Results for <span className="text-cv-primary">&ldquo;{q}&rdquo;</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hadError
            ? "Search is temporarily unavailable. Please try again."
            : total === 0
              ? "No matches yet — try a broader keyword."
              : `${total} match${total === 1 ? "" : "es"} across stores, coupons, and categories.`}
        </p>
      </header>

      {!hadError && results.coupons.length > 0 && (
        <Section title="Coupons">
          {results.coupons.map((hit) => (
            <Link
              key={hit.id}
              href={`/coupons/${hit.slug}`}
              className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="line-clamp-1 font-medium">{hit.title}</p>
              {hit.snippet && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{hit.snippet}</p>
              )}
              <span className="mt-auto pt-3 text-xs font-semibold text-cv-primary">
                View coupon →
              </span>
            </Link>
          ))}
        </Section>
      )}

      {!hadError && results.stores.length > 0 && (
        <Section title="Stores">
          {results.stores.map((hit) => (
            <Link
              key={hit.id}
              href={`/stores/${hit.slug}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              {hit.imageUrl && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted p-1.5">
                  <Image
                    src={hit.imageUrl}
                    alt={hit.title}
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{hit.title}</p>
                {hit.snippet && (
                  <p className="line-clamp-1 text-xs text-muted-foreground">{hit.snippet}</p>
                )}
              </div>
            </Link>
          ))}
        </Section>
      )}

      {!hadError && results.categories.length > 0 && (
        <Section title="Categories">
          {results.categories.map((hit) => (
            <Link
              key={hit.id}
              href={`/categories/${hit.slug}`}
              className="rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground hover:bg-secondary/80"
            >
              {hit.title}
            </Link>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
