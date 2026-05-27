import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { categoriesApi } from "@/lib/api/categories";
import { isApiError } from "@/lib/api/errors";
import { CouponList } from "@/features/catalog/components/CouponList";
import { JsonLd } from "@/lib/seo/jsonLd";
import {
  breadcrumbSchema,
  collectionPageSchema,
  itemListSchema,
} from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/meta";
import { canonicalFor } from "@/lib/seo/urls";
import { type Locale } from "@/lib/i18n/config";

export const revalidate = 60;

type Params = Promise<{ locale: Locale; slug: string }>;
type SearchParams = Promise<{ cursor?: string }>;

async function loadCategory(slug: string) {
  try {
    return await categoriesApi.bySlug(slug);
  } catch (err) {
    if (isApiError(err) && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const cat = await loadCategory(slug);
  if (!cat) return { title: "Category not found", robots: { index: false } };
  const path = `/categories/${cat.slug}`;
  return buildMetadata({
    title: cat.metaTitle ?? `${cat.title} Coupons & Deals`,
    description:
      cat.metaDescription ??
      cat.description ??
      `Latest coupons and deals in ${cat.title}.`,
    path,
    locale,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "categories" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const sp = await searchParams;
  const cat = await loadCategory(slug);
  if (!cat) notFound();

  let coupons: Awaited<ReturnType<typeof categoriesApi.coupons>>["data"] = [];
  let nextCursor: string | null = null;
  try {
    const page = await categoriesApi.coupons(slug, sp.cursor, 24);
    coupons = page.data;
    nextCursor = page.page.nextCursor;
  } catch {
    // Empty state below if backend errors
  }

  const url = canonicalFor(`/categories/${cat.slug}`, locale);
  const homeUrl = canonicalFor("/", locale);
  const categoriesUrl = canonicalFor("/categories", locale);

  return (
    <div className="container py-8 md:py-12">
      <JsonLd
        id="ld-collectionpage"
        data={collectionPageSchema({
          url,
          name: cat.title,
          description: cat.description,
          itemCount: coupons.length,
        })}
      />
      {coupons.length > 0 && (
        <JsonLd
          id="ld-itemlist"
          data={itemListSchema({
            url,
            name: `${cat.title} coupons`,
            entries: coupons.map((c) => ({
              url: canonicalFor(`/coupons/${c.slug}`, locale),
              name: c.title,
            })),
          })}
        />
      )}
      <JsonLd
        id="ld-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", url: homeUrl },
          { name: t("listTitle"), url: categoriesUrl },
          { name: cat.title, url },
        ])}
      />

      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span aria-hidden>›</span>
        <Link href="/categories" className="hover:text-foreground">{t("listTitle")}</Link>
        <span aria-hidden>›</span>
        <span className="font-medium text-foreground">{cat.title}</span>
      </nav>

      <header className="mb-8 max-w-3xl">
        <h1 className="cv-h1 text-cv-primary">{cat.title}</h1>
        {cat.description && (
          <p className="mt-2 text-muted-foreground">{cat.description}</p>
        )}
      </header>

      <CouponList
        coupons={coupons}
        emptyLabel={t("noCouponsInCategory", { category: cat.title })}
      />

      {nextCursor && (
        <div className="mt-10 text-center">
          <Link
            href={{ pathname: `/categories/${slug}`, query: { cursor: nextCursor } }}
            className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {tCommon("loadMore")}
          </Link>
        </div>
      )}
    </div>
  );
}
