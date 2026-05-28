import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { couponsApi } from "@/lib/api/coupons";
import { isApiError } from "@/lib/api/errors";
import { CouponReveal } from "@/features/catalog/components/CouponReveal";
import { SaveCouponButton } from "@/features/savedcoupons/components/SaveCouponButton";
import { CouponHero } from "@/features/catalog/components/CouponHero";
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

  const url = canonicalFor(`/coupons/${detail.slug}`, locale);
  const homeUrl = canonicalFor("/", locale);
  const couponsUrl = canonicalFor("/coupons", locale);

  return (
    <>
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

      {/* Phase 3 hero — store logo + name, title H1, savings big, inline meta
          (verified · exclusive · used · expires). Replaces the duplicated
          breadcrumb-style store back-link + badge row + H1 that the old
          layout stacked. */}
      <CouponHero coupon={detail} />

      <div className="container max-w-3xl py-8 md:py-10">
        <article className="rounded-lg border border-clipupp-neutral-200 bg-white p-6 shadow-card md:p-8">
          <div className="flex items-start justify-between gap-3">
            <p className="clipupp-body text-clipupp-neutral-700">{detail.description}</p>
            <SaveCouponButton couponId={detail.id} />
          </div>

          {detail.code ? (
            <div className="mt-6">
              <CouponReveal code={detail.code} couponId={detail.id} />
            </div>
          ) : (
            <a
              href={`/r/${detail.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-clipupp-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-clipupp-primary-strong"
            >
              {t("getThisDeal")}
            </a>
          )}

          {detail.minPurchase && (
            <p className="mt-4 text-[13px] text-clipupp-neutral-600">
              <span className="font-semibold text-clipupp-neutral-900">
                {t("minimumPurchase")}:
              </span>{" "}
              {detail.minPurchase}
              {detail.minPurchaseCurrency ? ` ${detail.minPurchaseCurrency}` : ""}
            </p>
          )}

          {/* Terms — wrapped in native <details> so they don't push content
              below the fold. Default closed; expands inline on click. No JS. */}
          {detail.terms && (
            <details className="group/terms mt-6 rounded-md border border-clipupp-neutral-200 bg-clipupp-neutral-50 p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-clipupp-neutral-900 outline-none">
                {t("terms")}
                <ChevronDown
                  className="h-4 w-4 transition-transform group-open/terms:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-clipupp-neutral-700">
                {detail.terms}
              </p>
            </details>
          )}

          {detail.categorySlugs.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-xs text-clipupp-neutral-500">{t("categories")}:</span>
              {detail.categorySlugs.map((s) => (
                <Link
                  key={s}
                  href={`/categories/${s}`}
                  className="rounded-full bg-clipupp-primary-soft px-2.5 py-0.5 text-xs font-semibold text-clipupp-primary transition-colors hover:bg-clipupp-primary hover:text-white"
                >
                  {s}
                </Link>
              ))}
            </div>
          )}
        </article>

        <p className="mt-6 text-center text-xs text-clipupp-neutral-500">
          {tCommon("verified")} by the Clipupp editorial team.
        </p>
      </div>
    </>
  );
}
