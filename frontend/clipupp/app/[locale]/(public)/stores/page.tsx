import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { storesApi } from "@/lib/api/stores";
import { categoriesApi } from "@/lib/api/categories";
import { isApiError } from "@/lib/api/errors";
import { StoreFilters } from "@/features/catalog/components/StoreFilters";
import { AlphabetJumpBar } from "@/features/catalog/components/AlphabetJumpBar";
import { JsonLd } from "@/lib/seo/jsonLd";
import { itemListSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/meta";
import { canonicalFor } from "@/lib/seo/urls";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 30;

type Params = Promise<{ locale: Locale }>;
type SearchParams = Promise<{
  country?: string;
  category?: string;
  cursor?: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.stores" });
  return buildMetadata({
    title: t("title"),
    description: t("description"),
    path: "/stores",
    locale,
  });
}

export default async function StoresPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "stores" });

  const sp = await searchParams;
  let stores: Awaited<ReturnType<typeof storesApi.list>>["data"] = [];
  let nextCursor: string | null = null;
  let hadError = false;

  // Parallel-fetch the categories tree alongside the stores list so the
  // filter dropdown gets its options without a client-side React Query call.
  const [storesPageResult, categoryTree] = await Promise.all([
    (async () => {
      try {
        return await storesApi.list({
          country: sp.country,
          category: sp.category,
          cursor: sp.cursor,
          limit: 24,
        });
      } catch (err) {
        if (!(isApiError(err) && err.status === 404)) hadError = true;
        return null;
      }
    })(),
    categoriesApi.tree().catch(() => []),
  ]);
  if (storesPageResult) {
    stores = storesPageResult.data;
    nextCursor = storesPageResult.page.nextCursor;
  }
  const filterCategories = (categoryTree ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
  }));

  const listUrl = canonicalFor("/stores", locale);

  return (
    <>
      {stores.length > 0 && (
        <JsonLd
          id="ld-itemlist"
          data={itemListSchema({
            url: listUrl,
            name: t("listTitle"),
            entries: stores.map((s) => ({
              url: canonicalFor(`/stores/${s.slug}`, locale),
              name: s.name,
            })),
          })}
        />
      )}

      {/* List hero band — fade-down (white → primary-soft). */}
      <section className="clipupp-section-bg-fade-down border-b border-clipupp-neutral-200">
        <div className="clipupp-container py-10 lg:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="clipupp-eyebrow-vivid mx-auto">All brands</p>
            <h1 className="clipupp-display-hero mt-3">
              <span className="clipupp-text-gradient-hero">{t("listTitle")}</span>
            </h1>
            <p className="clipupp-body mt-3 text-clipupp-neutral-700">
              {t("listSubtitle")}
            </p>
          </div>
        </div>
      </section>

      <div className="clipupp-container py-8 md:py-10">

      <Suspense>
        <StoreFilters categories={filterCategories} />
      </Suspense>

      {hadError ? (
        <p className="text-center text-sm text-destructive">{t("loadError")}</p>
      ) : stores.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("emptyState")}</p>
      ) : (
        <>
          {/* Phase 4 — A-Z jump strip. Letters present in the current
              page's stores get active anchor links; missing letters render
              as disabled chips so the bar always fills its row. Each
              store card whose name's first letter is "new" gets that
              letter's anchor id so the chip click scrolls to it. */}
          {(() => {
            const lettersPresent = new Set<string>();
            for (const s of stores) {
              const ch = (s.name || "").trim().charAt(0).toUpperCase();
              lettersPresent.add(/[A-Z]/.test(ch) ? ch : "#");
            }
            return (
              <AlphabetJumpBar
                availableLetters={Array.from(lettersPresent).sort()}
              />
            );
          })()}

          <ul className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-5">
            {(() => {
              // Track which letter each store anchors. Only the FIRST store
              // for each letter gets the anchor id, so chip clicks land on
              // the correct boundary even though the grid is multi-column.
              const seenLetters = new Set<string>();
              return stores.map((store) => {
                const ch = (store.name || "").trim().charAt(0).toUpperCase();
                const anchor = /[A-Z]/.test(ch) ? ch : "num";
                const isFirstForLetter = !seenLetters.has(anchor);
                if (isFirstForLetter) seenLetters.add(anchor);
                return (
                  <li
                    key={store.id}
                    id={isFirstForLetter ? `letter-${anchor}` : undefined}
                    className={isFirstForLetter ? "h-full scroll-mt-24" : "h-full"}
                  >
                    <Link
                      href={`/stores/${store.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-lg border border-clipupp-neutral-200 bg-white shadow-card"
                    >
                      {/* Logo tile — flat white, contained image. Aspect ratio
                          reserves space so the card never shifts. */}
                      <div className="relative flex aspect-[5/3] items-center justify-center overflow-hidden border-b border-clipupp-neutral-200 bg-white p-6">
                        {store.cashbackRate && (
                          <div className="absolute right-2 top-2 inline-flex items-center rounded-sm bg-clipupp-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-clipupp-accent-strong">
                            {store.cashbackRate}
                          </div>
                        )}
                        <Image
                          src={store.logoUrl || "/placeholder.svg"}
                          alt={store.name}
                          width={200}
                          height={120}
                          className="h-full w-full object-contain"
                          unoptimized
                        />
                      </div>

                      {/* Info — flex-col with mt-auto on the CTA pins it bottom. */}
                      <div className="flex flex-1 flex-col gap-1.5 p-4">
                        <h2 className="truncate text-base font-bold text-gray-900 group-hover:text-clipupp-primary">
                          {store.name}
                        </h2>
                        {store.rating && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star
                              className="h-3 w-3 fill-[var(--clipupp-primary)] text-clipupp-primary"
                              aria-hidden
                            />
                            <span className="font-semibold text-gray-700">{store.rating}</span>
                            {store.reviewCount > 0 && (
                              <span className="text-clipupp-neutral-400">
                                · {store.reviewCount.toLocaleString()} reviews
                              </span>
                            )}
                          </div>
                        )}
                        {store.shortDescription && (
                          <p className="line-clamp-2 text-[13px] leading-snug text-muted-foreground">
                            {store.shortDescription}
                          </p>
                        )}
                        <span className="mt-auto inline-flex w-full items-center justify-center gap-1 rounded-md bg-clipupp-primary px-3 py-2 text-[12px] font-bold uppercase tracking-wide text-white transition group-hover:bg-clipupp-primary-strong">
                          {t("viewDeals")} →
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              });
            })()}
          </ul>

          {nextCursor && (
            <div className="mt-10 text-center">
              <Link
                href={{
                  pathname: "/stores",
                  query: {
                    ...(sp.country ? { country: sp.country } : {}),
                    ...(sp.category ? { category: sp.category } : {}),
                    cursor: nextCursor,
                  },
                }}
                className="clipupp-btn-ghost"
              >
                Load more
              </Link>
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}
