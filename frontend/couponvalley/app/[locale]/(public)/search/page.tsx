import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Search as SearchIcon } from "lucide-react";
import { searchApi } from "@/lib/api/search";
import { isApiError } from "@/lib/api/errors";
import { EmptyState } from "@/components/site/EmptyState";

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
      <div className="cv-section-bg-primary-soft">
        <div className="cv-container py-16">
          <EmptyState
            icon={SearchIcon}
            tone="primary"
            title="What are you looking for today?"
            description="Try searching for a brand, a category, or an offer keyword from the header."
          />
        </div>
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

  const total =
    results.stores.length + results.coupons.length + results.categories.length;

  return (
    <>
      {/* Compact hero with gradient query */}
      <section className="cv-section-bg-primary-soft">
        <div className="cv-container py-10 lg:py-12">
          <p className="cv-eyebrow-vivid">Search results</p>
          <h1 className="cv-display-hero mt-2 text-[1.75rem] lg:text-[2.25rem]">
            Results for{" "}
            <span className="cv-text-gradient-hero">&ldquo;{q}&rdquo;</span>
          </h1>
          <p className="cv-body mt-3 text-cv-neutral-700">
            {hadError
              ? "Search is temporarily unavailable. Please try again."
              : total === 0
                ? "No matches yet — try a broader keyword."
                : `${total} match${total === 1 ? "" : "es"} across stores, coupons, and categories.`}
          </p>
        </div>
      </section>

      <div className="cv-container py-10">
        {total === 0 && !hadError && (
          <EmptyState
            icon={SearchIcon}
            tone="accent"
            title="Nothing for that exact phrase"
            description="Try fewer or broader keywords — or browse all stores to find what you need."
          >
            <Link href="/stores" className="cv-btn-primary-gradient">
              Browse all stores
            </Link>
          </EmptyState>
        )}

        {!hadError && results.coupons.length > 0 && (
          <Section eyebrow="Coupons">
            {results.coupons.map((hit) => (
              <Link
                key={hit.id}
                href={`/coupons/${hit.slug}`}
                className="cv-card flex h-full flex-col p-4"
              >
                <p className="line-clamp-1 cv-h3">{hit.title}</p>
                {hit.snippet && (
                  <p className="cv-meta mt-1 line-clamp-2">{hit.snippet}</p>
                )}
                <span className="mt-auto pt-3 text-xs font-bold text-cv-primary-700">
                  View coupon →
                </span>
              </Link>
            ))}
          </Section>
        )}

        {!hadError && results.stores.length > 0 && (
          <Section eyebrow="Stores">
            {results.stores.map((hit) => (
              <Link
                key={hit.id}
                href={`/stores/${hit.slug}`}
                className="cv-card flex items-center gap-3 p-4"
              >
                {hit.imageUrl && (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cv-neutral-100 p-1.5">
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
                  <p className="truncate cv-h3">{hit.title}</p>
                  {hit.snippet && (
                    <p className="line-clamp-1 cv-meta">{hit.snippet}</p>
                  )}
                </div>
              </Link>
            ))}
          </Section>
        )}

        {!hadError && results.categories.length > 0 && (
          <Section eyebrow="Categories">
            <div className="col-span-full flex flex-wrap gap-2">
              {results.categories.map((hit) => (
                <Link
                  key={hit.id}
                  href={`/categories/${hit.slug}`}
                  className="cv-btn-soft-pill text-sm"
                >
                  {hit.title}
                </Link>
              ))}
            </div>
          </Section>
        )}
      </div>
    </>
  );
}

function Section({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <p className="cv-eyebrow-vivid mb-4">{eyebrow}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}
