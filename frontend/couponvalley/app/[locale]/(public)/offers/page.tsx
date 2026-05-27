import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { offersApi } from "@/lib/api/coupons";
import { isApiError } from "@/lib/api/errors";
import { CouponList } from "@/features/catalog/components/CouponList";
import { CouponFilters } from "@/features/catalog/components/CouponFilters";
import { JsonLd } from "@/lib/seo/jsonLd";
import { itemListSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/meta";
import { canonicalFor } from "@/lib/seo/urls";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 30;

type Params = Promise<{ locale: Locale }>;
type SearchParams = Promise<{ category?: string; cursor?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.offers" });
  return buildMetadata({
    title: t("title"),
    description: t("description"),
    path: "/offers",
    locale,
  });
}

export default async function OffersPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "offers" });

  const sp = await searchParams;
  let offers: Awaited<ReturnType<typeof offersApi.list>>["data"] = [];
  let nextCursor: string | null = null;
  let hadError = false;

  try {
    const page = await offersApi.list({
      category: sp.category,
      cursor: sp.cursor,
      limit: 24,
    });
    offers = page.data;
    nextCursor = page.page.nextCursor;
  } catch (err) {
    hadError = !(isApiError(err) && err.status === 404);
  }

  const listUrl = canonicalFor("/offers", locale);

  return (
    <div className="container py-8 md:py-12">
      {offers.length > 0 && (
        <JsonLd
          id="ld-itemlist"
          data={itemListSchema({
            url: listUrl,
            name: t("listTitle"),
            entries: offers.map((o) => ({
              url: canonicalFor(`/coupons/${o.slug}`, locale),
              name: o.title,
            })),
          })}
        />
      )}
      <header className="mb-6 max-w-3xl">
        <h1 className="cv-gradient-text text-3xl font-bold tracking-tight md:text-4xl">
          {t("listTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("listSubtitle")}</p>
      </header>

      <Suspense>
        <CouponFilters />
      </Suspense>

      {hadError ? (
        <p className="text-sm text-destructive">{t("loadError")}</p>
      ) : (
        <>
          <CouponList coupons={offers} emptyLabel={t("emptyState")} />

          {nextCursor && (
            <div className="mt-10 text-center">
              <Link
                href={{
                  pathname: "/offers",
                  query: {
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
