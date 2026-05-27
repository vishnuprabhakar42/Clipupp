import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { couponsApi } from "@/lib/api/coupons";
import { isApiError } from "@/lib/api/errors";
import { CouponReveal } from "@/features/catalog/components/CouponReveal";
import { SaveCouponButton } from "@/features/savedcoupons/components/SaveCouponButton";
import { JsonLd } from "@/lib/seo/jsonLd";
import {
  breadcrumbSchema,
  offerSchema,
  productSchema,
} from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/meta";
import { canonicalFor } from "@/lib/seo/urls";
import { locales, type Locale } from "@/lib/i18n/config";

export const revalidate = 60;

type Params = Promise<{ locale: Locale; slug: string }>;

/**
 * Pre-render the top-200 coupons at build time for every locale. Anything
 * outside this list still works on-demand via ISR — this just warms Googlebot's
 * crawler against the highest-traffic pages so first-crawl hits a ready cache.
 */
export async function generateStaticParams() {
  try {
    const slugs = await couponsApi.topSlugs(200);
    return locales.flatMap((locale) =>
      slugs.map((slug) => ({ locale, slug }))
    );
  } catch {
    return [];
  }
}

async function load(slug: string) {
  try {
    return await couponsApi.bySlug(slug);
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
  const detail = await load(slug);
  if (!detail) return { title: "Coupon not found", robots: { index: false } };
  const path = `/coupons/${detail.slug}`;
  const title =
    detail.metaTitle ??
    `${detail.title}${detail.store ? ` — ${detail.store.name} Promo Code` : ""}`;
  const description = detail.metaDescription ?? detail.description.slice(0, 160);
  return buildMetadata({
    title,
    description,
    path,
    locale,
    // Product rich-result eligibility comes from the Product JSON-LD on the
    // page (see <JsonLd id="ld-product" />), not from og:type — Next's
    // Metadata.OpenGraph type doesn't accept "product".
    image: `/og/coupon/${detail.slug}`,
  });
}

export default async function CouponDetailPage({
  params,
}: {
  params: Params;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "coupons" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const detail = await load(slug);
  if (!detail) notFound();

  const expires = detail.expiresAt ? new Date(detail.expiresAt) : null;
  const url = canonicalFor(`/coupons/${detail.slug}`, locale);
  const homeUrl = canonicalFor("/", locale);
  const couponsUrl = canonicalFor("/coupons", locale);

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <JsonLd id="ld-offer" data={offerSchema({ coupon: detail, url })} />
      <JsonLd id="ld-product" data={productSchema({ coupon: detail, url })} />
      <JsonLd
        id="ld-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", url: homeUrl },
          { name: t("listTitle"), url: couponsUrl },
          { name: detail.title, url },
        ])}
      />

      {detail.store && (
        <Link
          href={`/stores/${detail.store.slug}`}
          className="mb-6 inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded bg-muted p-1">
            <Image
              src={detail.store.logoUrl || "/placeholder.svg"}
              alt={detail.store.name}
              width={40}
              height={40}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
          <span>← {detail.store.name}</span>
        </Link>
      )}

      <article className="rounded-md border bg-card p-6 md:p-8 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          {detail.savingsLabel && (
            <Badge className="bg-cv-primary text-white hover:bg-cv-primary-strong">{detail.savingsLabel}</Badge>
          )}
          {detail.verified && (
            <Badge variant="outline" className="border-cv-success/40 text-cv-success-strong">
              {tCommon("verified")}
            </Badge>
          )}
          {detail.exclusive && (
            <Badge variant="outline" className="border-cv-accent/40 text-cv-accent-strong">
              {tCommon("exclusive")}
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] uppercase">
            {detail.type === "CODE"
              ? tCommon("code")
              : detail.type === "DEAL"
                ? tCommon("deal")
                : detail.type === "FREE_SHIPPING"
                  ? tCommon("freeShipping")
                  : tCommon("inStore")}
          </Badge>
        </div>

        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold md:text-3xl">{detail.title}</h1>
          <SaveCouponButton couponId={detail.id} />
        </div>
        <p className="mt-2 text-muted-foreground">{detail.description}</p>

        {detail.code ? (
          <div className="mt-6">
            <CouponReveal code={detail.code} couponId={detail.id} />
          </div>
        ) : (
          <Link
            href={`/r/${detail.id}`}
            className="mt-6 inline-flex items-center justify-center rounded-md bg-cv-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-cv-primary-strong"
          >
            {t("getThisDeal")}
          </Link>
        )}

        <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          {expires && (
            <div>
              <span className="font-medium text-foreground">{tCommon("expires")}:</span>{" "}
              {expires.toLocaleDateString()}
            </div>
          )}
          {detail.usedCount > 0 && (
            <div>{t("used", { count: detail.usedCount })}</div>
          )}
          {detail.minPurchase && (
            <div>
              <span className="font-medium text-foreground">{t("minimumPurchase")}:</span>{" "}
              {detail.minPurchase}
              {detail.minPurchaseCurrency ? ` ${detail.minPurchaseCurrency}` : ""}
            </div>
          )}
        </div>

        {detail.terms && (
          <section className="mt-6 rounded-md bg-muted/40 p-4">
            <h2 className="mb-1 text-sm font-semibold">{t("terms")}</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{detail.terms}</p>
          </section>
        )}

        {detail.categorySlugs.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">{t("categories")}:</span>
            {detail.categorySlugs.map((s) => (
              <Link
                key={s}
                href={`/categories/${s}`}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground hover:bg-secondary/80"
              >
                {s}
              </Link>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
