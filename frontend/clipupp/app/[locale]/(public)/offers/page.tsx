import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { offersApi } from "@/lib/api/coupons";
import { categoriesApi } from "@/lib/api/categories";
import { isApiError } from "@/lib/api/errors";
import { CouponList } from "@/features/catalog/components/CouponList";
import { CouponFilters } from "@/features/catalog/components/CouponFilters";
import { Flame } from "lucide-react";
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

  // Parallel-fetch offers + categories so the filter dropdown can render
  // without a client-side React Query call.
  const [offersPageResult, categoryTree] = await Promise.all([
    (async () => {
      try {
        return await offersApi.list({
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
  if (offersPageResult) {
    offers = offersPageResult.data;
    nextCursor = offersPageResult.page.nextCursor;
  }
  const filterCategories = (categoryTree ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
  }));

  const listUrl = canonicalFor("/offers", locale);

  return (
    <>
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

      <section className="clipupp-section-bg-fade-down border-b border-clipupp-neutral-200">
        <div className="clipupp-container py-10 lg:py-14">
          <div className="flex items-start gap-5">
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-white shadow-glow-accent"
              style={{
                background:
                  "linear-gradient(135deg, var(--clipupp-accent-700), var(--clipupp-accent-500))",
              }}
              aria-hidden
            >
              <Flame className="h-8 w-8" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="clipupp-eyebrow-vivid clipupp-eyebrow-vivid--accent">
                Hot Deals
              </p>
              <h1 className="clipupp-display-hero mt-2">
                <span className="clipupp-text-gradient-savings">
                  {t("listTitle")}
                </span>
              </h1>
              <p className="clipupp-body mt-3 max-w-2xl text-clipupp-neutral-700">
                {t("listSubtitle")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="clipupp-container py-10">
        <Suspense>
          <CouponFilters categories={filterCategories} />
        </Suspense>

        {hadError ? (
          <p className="text-sm text-clipupp-danger-strong">{t("loadError")}</p>
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
