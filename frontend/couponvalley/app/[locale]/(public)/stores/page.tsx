import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { storesApi } from "@/lib/api/stores";
import { isApiError } from "@/lib/api/errors";
import { StoreFilters } from "@/features/catalog/components/StoreFilters";
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

  try {
    const page = await storesApi.list({
      country: sp.country,
      category: sp.category,
      cursor: sp.cursor,
      limit: 24,
    });
    stores = page.data;
    nextCursor = page.page.nextCursor;
  } catch (err) {
    hadError = !(isApiError(err) && err.status === 404);
  }

  const listUrl = canonicalFor("/stores", locale);

  return (
    <div className="container py-8 md:py-12">
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
      <header className="mx-auto mb-6 max-w-3xl text-center">
        <h1 className="cv-gradient-text text-3xl font-bold tracking-tight md:text-4xl">
          {t("listTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("listSubtitle")}</p>
      </header>

      <Suspense>
        <StoreFilters />
      </Suspense>

      {hadError ? (
        <p className="text-center text-sm text-destructive">{t("loadError")}</p>
      ) : stores.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("emptyState")}</p>
      ) : (
        <>
          <ul className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-5">
            {stores.map((store) => (
              <li key={store.id} className="h-full">
                <Link
                  href={`/stores/${store.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-cv-neutral-200 bg-white shadow-card"
                >
                  {/* Logo tile — flat white, contained image. Aspect ratio
                      reserves space so the card never shifts. */}
                  <div className="relative flex aspect-[5/3] items-center justify-center overflow-hidden border-b border-cv-neutral-200 bg-white p-6">
                    {store.cashbackRate && (
                      <div className="absolute right-2 top-2 inline-flex items-center rounded-sm bg-cv-accent-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-cv-accent-strong">
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
                    <h2 className="truncate text-base font-bold text-gray-900 group-hover:text-cv-primary">
                      {store.name}
                    </h2>
                    {store.rating && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star
                          className="h-3 w-3 fill-[var(--cv-primary)] text-cv-primary"
                          aria-hidden
                        />
                        <span className="font-semibold text-gray-700">{store.rating}</span>
                        {store.reviewCount > 0 && (
                          <span className="text-cv-neutral-400">
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
                    <span className="mt-auto inline-flex w-full items-center justify-center gap-1 rounded-md bg-cv-primary px-3 py-2 text-[12px] font-bold uppercase tracking-wide text-white transition group-hover:bg-cv-primary-strong">
                      {t("viewDeals")} →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
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
                className="cv-btn-ghost"
              >
                Load more
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
