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
    <div className="container py-8 md:py-12">
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
      <header className="mb-8 max-w-3xl">
        <h1 className="cv-h1 text-cv-primary">Active coupons</h1>
        <p className="mt-2 text-muted-foreground">
          Verified discount codes you can paste at checkout, ranked by recent activity.
        </p>
      </header>

      {hadError ? (
        <p className="text-sm text-destructive">
          We couldn&apos;t load coupons right now. Please try again in a moment.
        </p>
      ) : (
        <>
          <CouponList coupons={coupons} emptyLabel="No coupons match your filters yet." />

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
                className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
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
