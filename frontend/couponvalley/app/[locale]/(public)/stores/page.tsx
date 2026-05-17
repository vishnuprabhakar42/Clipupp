import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { storesApi } from "@/lib/api/stores";
import { isApiError } from "@/lib/api/errors";
import { StoreFilters } from "@/features/catalog/components/StoreFilters";
import { canonicalFor, hreflangAlternates } from "@/lib/seo/urls";
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
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: canonicalFor("/stores", locale),
      languages: hreflangAlternates("/stores"),
    },
  };
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

  return (
    <div className="container py-8 md:py-12">
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
          <ul className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {stores.map((store) => (
              <li key={store.id}>
                <Link
                  href={`/stores/${store.slug}`}
                  className="cv-card group flex h-full flex-col p-5 hover:-translate-y-0.5"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-lg bg-muted p-2">
                      <Image
                        src={store.logoUrl || "/placeholder.svg"}
                        alt={store.name}
                        width={56}
                        height={56}
                        className="h-full w-full object-contain"
                        unoptimized
                      />
                    </div>
                    <div>
                      <h2 className="font-semibold leading-tight text-cv-primary group-hover:text-cv-primary-strong">
                        {store.name}
                      </h2>
                      {store.rating && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Star
                            className="h-3 w-3 fill-[var(--cv-primary)] text-cv-primary"
                            aria-hidden
                          />
                          <span>{store.rating}</span>
                          {store.reviewCount > 0 && (
                            <span className="text-cv-primary/60">
                              · {store.reviewCount} reviews
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {store.shortDescription && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {store.shortDescription}
                    </p>
                  )}
                  <span className="mt-auto pt-4 text-sm font-medium text-cv-primary group-hover:underline">
                    {t("viewDeals")} →
                  </span>
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
