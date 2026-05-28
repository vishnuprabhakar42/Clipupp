import { CheckCircle2, Search, ShieldCheck, Sparkles, Tag } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { categoriesApi } from "@/lib/api/categories";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Top-of-page hero with a prominent search box and category quick-jump
 * pills. Designed to be the LCP candidate on the home page: pure HTML,
 * server-rendered, no client JS, no photographic asset — gradient mesh
 * + a text headline does the heavy lifting. The form GETs `/search?q=…`
 * so the entire interaction works without JavaScript.
 *
 * Visual tier (Phase 2): crimson mesh background, white display-mega H1
 * with one keyword in amber gradient, h-16 white pill search with an
 * embedded crimson-gradient submit, glass category chips, trust strip
 * in white with a live pulse-dot.
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

  const categories = await categoriesApi.tree().catch(() => []);
  const pillCategories = categories.slice(0, 8);

  return (
    <section
      aria-labelledby="hero-search-heading"
      className="clipupp-section-bg-mesh-primary relative overflow-hidden"
      style={{ minHeight: "clamp(420px, 50vh, 560px)" }}
    >
      <div className="clipupp-container relative py-14 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="clipupp-eyebrow-vivid mx-auto inline-flex"
            style={{ color: "#FFFFFF" }}
          >
            <span className="clipupp-pulse-dot mr-2" aria-hidden />
            Save smarter, not harder
          </p>
          <h1
            id="hero-search-heading"
            className="clipupp-display-mega mt-4 text-white"
          >
            {applyKeywordGradient(heading)}
          </h1>
          <p className="clipupp-body mx-auto mt-4 max-w-2xl text-white/85">
            {subtitle}
          </p>

          {/* Search pill — h-16 white container, gradient submit inside. */}
          <form
            action="/search"
            method="get"
            role="search"
            className="mx-auto mt-9 flex h-16 max-w-2xl items-center gap-2 rounded-full bg-white p-2 transition-shadow focus-within:shadow-glow-primary"
            style={{ boxShadow: "var(--clipupp-shadow-lifted)" }}
          >
            <label htmlFor="hero-search-input" className="sr-only">
              Search stores, coupons, and brands
            </label>
            <Search
              className="ml-4 h-5 w-5 shrink-0 text-clipupp-neutral-500"
              aria-hidden
            />
            <input
              id="hero-search-input"
              type="search"
              name="q"
              placeholder="Search stores, coupons, or brands…"
              className="flex-1 bg-transparent text-[15px] text-clipupp-neutral-900 outline-none placeholder:text-clipupp-neutral-400"
              autoComplete="off"
            />
            <button
              type="submit"
              className="clipupp-btn-primary-gradient h-12 rounded-full px-7 text-[14px] font-extrabold uppercase tracking-wide"
            >
              <Search className="h-4 w-4 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">Search deals</span>
            </button>
          </form>

          {pillCategories.length > 0 && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/75">
                <Tag className="h-3 w-3" aria-hidden />
                Popular
              </span>
              {pillCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="clipupp-btn-glass rounded-full px-4 py-1.5 text-[12px] font-bold min-h-0"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          )}

          {/* Trust strip — white text on hero. */}
          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[14px] font-medium text-white/85">
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2
                className="h-4 w-4 text-clipupp-success"
                aria-hidden
                strokeWidth={2.25}
              />
              <span>
                <span className="font-display font-extrabold text-white">
                  10,000+
                </span>{" "}
                coupons
              </span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Tag
                className="h-4 w-4 text-clipupp-accent-400"
                aria-hidden
                strokeWidth={2.25}
              />
              <span>
                <span className="font-display font-extrabold text-white">
                  500+
                </span>{" "}
                stores
              </span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck
                className="h-4 w-4 text-clipupp-success"
                aria-hidden
                strokeWidth={2.25}
              />
              <span>Verified daily</span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Sparkles
                className="h-4 w-4 text-clipupp-accent-400"
                aria-hidden
                strokeWidth={2.25}
              />
              <span>Free forever</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/**
 * Wraps the last word of the heading in a savings-gradient span so the H1
 * has one accent without breaking the text-balance / LCP candidate.
 */
function applyKeywordGradient(heading: string): React.ReactNode {
  const trimmed = heading.trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace < 0) {
    return <span className="clipupp-text-gradient-savings">{trimmed}</span>;
  }
  const before = trimmed.slice(0, lastSpace);
  const lastWord = trimmed.slice(lastSpace + 1);
  return (
    <>
      {before}{" "}
      <span className="clipupp-text-gradient-savings">{lastWord}</span>
    </>
  );
}
