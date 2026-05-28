import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { couponsApi } from "@/lib/api/coupons";
import { isApiError } from "@/lib/api/errors";
import { CouponList } from "@/features/catalog/components/CouponList";
import { JsonLd } from "@/lib/seo/jsonLd";
import { itemListSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/meta";
import { canonicalFor } from "@/lib/seo/urls";
import type { Locale } from "@/lib/i18n/config";

export const revalidate = 30;

type Params = Promise<{ locale: Locale }>;
type SearchParams = Promise<{
  category?: string;
  storeId?: string;
  cursor?: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: "Coupons & Promo Codes",
    description:
      "Active coupon codes from top stores. Verified daily — copy and paste at checkout to save.",
    path: "/coupons",
    locale,
  });
}

export default async function CouponsListPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  let coupons: Awaited<ReturnType<typeof couponsApi.list>>["data"] = [];
  let nextCursor: string | null = null;
  let hadError = false;

  try {
    const page = await couponsApi.list({
      storeId: sp.storeId,
      category: sp.category,
      cursor: sp.cursor,
      limit: 24,
    });
    coupons = page.data;
    nextCursor = page.page.nextCursor;
  } catch (err) {
    hadError = !(isApiError(err) && err.status === 404);
  }

  const listUrl = canonicalFor("/coupons", locale);

  return (
    <>
      {coupons.length > 0 && (
        <JsonLd
          id="ld-itemlist"
          data={itemListSchema({
            url: listUrl,
            name: "Active coupons",
            entries: coupons.map((c) => ({
              url: canonicalFor(`/coupons/${c.slug}`, locale),
              name: c.title,
            })),
          })}
        />
      )}

      <section className="cv-section-bg-fade-down border-b border-cv-neutral-200">
        <div className="cv-container py-10 lg:py-14">
          <div className="max-w-3xl">
            <p className="cv-eyebrow-vivid">Verified daily</p>
            <h1 className="cv-display-hero mt-3">
              <span className="cv-text-gradient-hero">Active</span> coupons
            </h1>
            <p className="cv-body mt-3 text-cv-neutral-700">
              Discount codes you can paste at checkout, ranked by recent
              activity. Every code retested in the last 24 hours.
            </p>
          </div>
        </div>
      </section>

      <div className="cv-container py-10">
        {hadError ? (
          <p className="text-sm text-cv-danger-strong">
            We couldn&apos;t load coupons right now. Please try again in a moment.
          </p>
        ) : (
          <>
            <CouponList
              coupons={coupons}
              emptyLabel="No coupons match your filters yet."
            />

            {nextCursor && (
              <div className="mt-10 text-center">
                <Link
                  href={{
                    pathname: "/coupons",
                    query: {
                      ...(sp.category ? { category: sp.category } : {}),
                      ...(sp.storeId ? { storeId: sp.storeId } : {}),
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
    </>
  );
}
