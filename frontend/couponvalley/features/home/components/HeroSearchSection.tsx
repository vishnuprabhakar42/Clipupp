import { Search, Tag } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { categoriesApi } from "@/lib/api/categories";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Top-of-page hero with a prominent search box and category quick-jump
 * pills. Designed to be the LCP candidate on the home page: pure HTML,
 * server-rendered, no client JS, no large hero image.
 *
 * The form GETs `/search?q=...` so the entire interaction works without
 * JavaScript — important for both SEO and CWV.
 */
export async function HeroSearchSection({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Find a coupon for any store";
  const subtitle =
    section?.subtitle ??
    "Search thousands of verified coupons and deals from the brands you love. Updated daily by our editorial team.";

  // Top categories for quick-jump pills — fetched server-side so the chips
  // are in the initial HTML for SEO + LCP.
  const categories = await categoriesApi.tree().catch(() => []);
  const pillCategories = categories.slice(0, 8);

  return (
    <section aria-labelledby="hero-search-heading" className="bg-cv-primary-soft">
      <div className="cv-container py-14 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="cv-tag bg-transparent px-0 text-cv-primary">
            Save smarter, not harder
          </p>
          <h1 id="hero-search-heading" className="cv-h1 mt-3">
            {heading}
          </h1>
          <p className="cv-body mx-auto mt-4 max-w-2xl text-cv-neutral-600">
            {subtitle}
          </p>

          {/* Search form — pure HTML form, GETs /search?q=... */}
          <form
            action="/search"
            method="get"
            role="search"
            className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-md border-[1.5px] border-cv-neutral-200 bg-white p-1.5 shadow-card focus-within:border-cv-primary focus-within:ring-2 focus-within:ring-cv-primary/30"
          >
            <label htmlFor="hero-search-input" className="sr-only">
              Search stores, coupons, and brands
            </label>
            <Search
              className="ml-3 h-5 w-5 shrink-0 text-cv-neutral-400"
              aria-hidden
            />
            <input
              id="hero-search-input"
              type="search"
              name="q"
              placeholder="Search stores, coupons, or brands…"
              className="flex-1 bg-transparent text-[15px] text-cv-neutral-900 outline-none placeholder:text-cv-neutral-400"
              autoComplete="off"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-1.5 rounded-md bg-cv-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-cv-primary-strong"
            >
              <Search className="h-4 w-4 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {pillCategories.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-cv-neutral-500">
                <Tag className="h-3 w-3" aria-hidden />
                Popular
              </span>
              {pillCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="rounded-full border border-cv-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-cv-neutral-700 transition-colors hover:border-cv-primary hover:text-cv-primary"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
