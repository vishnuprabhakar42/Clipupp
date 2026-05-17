import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ExternalLink,
  MapPin,
  Phone,
  Shield,
  Star,
  Tag,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { storesApi } from "@/lib/api/stores";
import { isApiError } from "@/lib/api/errors";
import { StoreTypeTabs } from "@/features/catalog/components/StoreTypeTabs";
import { StoreSchema } from "@/components/seo/StoreSchema";
import { FAQPageSchema } from "@/components/seo/FAQPageSchema";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { canonicalFor, hreflangAlternates, siteUrl } from "@/lib/seo/urls";
import { type Locale } from "@/lib/i18n/config";

export const revalidate = 60;

type Params = Promise<{ locale: Locale; slug: string }>;

async function loadDetail(slug: string) {
  try {
    return await storesApi.bySlug(slug);
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
  const detail = await loadDetail(slug);
  if (!detail) return { title: "Store not found", robots: { index: false } };
  const path = `/stores/${detail.slug}`;
  const title =
    detail.metaTitle ?? `${detail.name} Coupons, Promo Codes & Deals`;
  const description =
    detail.metaDescription ??
    detail.shortDescription ??
    `Save with verified ${detail.name} coupons, promo codes, and exclusive deals — tested and updated regularly.`;
  return {
    title,
    description,
    alternates: {
      canonical: canonicalFor(path, locale),
      languages: hreflangAlternates(path),
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalFor(path, locale),
      images: [
        {
          url: `${siteUrl()}/og/store/${detail.slug}`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function StoreDetailPage({
  params,
}: {
  params: Params;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "stores" });

  // All fetches in parallel — zero server waterfall
  const [detail, couponsPage, similar, popularPage] = await Promise.all([
    loadDetail(slug),
    storesApi.coupons(slug, 0, 24),
    storesApi.similar(slug, 20),
    storesApi.list({ limit: 16 }),
  ]);
  if (!detail) notFound();

  const url = canonicalFor(`/stores/${detail.slug}`, locale);
  const homeUrl = canonicalFor("/", locale);
  const storesUrl = canonicalFor("/stores", locale);

  const totalOffers = detail.stats?.totalOffers ?? couponsPage.data.length;
  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const lastVerified = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Filter current store out of popular list
  const popularStores = popularPage.data
    .filter((s) => s.slug !== detail.slug)
    .slice(0, 14);

  const introText = [
    `Find the best ${detail.name} coupons, promo codes and deals for ${monthYear}.`,
    `CouponValley has ${totalOffers} verified ${detail.name} offers — tested and updated regularly by our team.`,
    detail.shortDescription ??
      `Browse coupon codes, free shipping deals, and exclusive offers to save on your next purchase at ${detail.name}.`,
  ].join(" ");

  return (
    <>
      <StoreSchema store={detail} url={url} />
      {detail.faqs.length > 0 && (
        <FAQPageSchema
          items={detail.faqs.map((f) => ({
            question: f.question,
            answer: f.answer,
          }))}
        />
      )}
      <BreadcrumbSchema
        items={[
          { name: "Home", url: homeUrl },
          { name: t("listTitle"), url: storesUrl },
          { name: detail.name, url },
        ]}
      />

      <div className="container max-w-7xl py-5">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex items-center gap-1 text-xs text-gray-500"
        >
          <Link href="/" className="hover:text-cv-primary hover:underline">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <Link
            href="/stores"
            className="hover:text-cv-primary hover:underline"
          >
            {t("listTitle")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="font-medium text-gray-700">{detail.name}</span>
        </nav>

        {/*
          Layout trick: DOM order is <aside>, <main> so that sidebar content
          is crawled first (good for SEO). On mobile, flex-col-reverse flips
          the visual order so coupons appear at the top. On desktop, the grid
          places aside in col-1 (left) and main in col-2 (right) naturally.
        */}
        <div className="flex flex-col-reverse gap-8 lg:grid lg:grid-cols-[320px_1fr] lg:items-start">

          {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
          <aside
            className="space-y-4"
            aria-label={`${detail.name} store information`}
          >
            {/* Store identity card */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-white p-1.5 shadow-sm">
                  <Image
                    src={detail.logoUrl || "/placeholder.svg"}
                    alt={detail.name}
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                    priority
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900">
                    {detail.name}
                  </h2>
                  {detail.rating && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs">
                      <StarRow rating={Number(detail.rating)} />
                      <span className="font-semibold text-gray-700">
                        {detail.rating}
                      </span>
                      {detail.reviewCount > 0 && (
                        <span className="text-gray-400">
                          ({detail.reviewCount.toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <a
                href={detail.primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-cv-primary py-2 text-sm font-bold text-white transition hover:bg-cv-primary-strong"
              >
                Visit {detail.name}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>

            {/* Top offers + Stats */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              {detail.topOffers.length > 0 && (
                <>
                  <h3 className="mb-3 text-sm font-bold text-gray-900">
                    Today&apos;s top {detail.name} offers:
                  </h3>
                  <ul className="mb-4 space-y-2">
                    {detail.topOffers.slice(0, 5).map((offer) => (
                      <li
                        key={offer}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <Tag
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cv-primary"
                          aria-hidden
                        />
                        {offer}
                      </li>
                    ))}
                  </ul>
                  <hr className="mb-4 border-gray-100" />
                </>
              )}
              {detail.stats && (
                <dl className="grid grid-cols-2 gap-2.5">
                  <StatBox
                    label="Total Offers"
                    value={detail.stats.totalOffers}
                  />
                  <StatBox
                    label="Coupon Codes"
                    value={detail.stats.couponCodes}
                  />
                  <StatBox
                    label="In-Store Coupons"
                    value={detail.stats.inStoreCoupons}
                  />
                  <StatBox
                    label="Free Shipping Deals"
                    value={detail.stats.freeShippingDeals}
                  />
                </dl>
              )}
            </div>

            {/* Content writer */}
            {detail.contentWriter && (
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  This page has been updated by
                </p>
                <div className="flex items-start gap-3">
                  {detail.contentWriter.imageUrl && (
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border bg-cv-primary-soft">
                      <Image
                        src={detail.contentWriter.imageUrl}
                        alt={detail.contentWriter.name}
                        width={44}
                        height={44}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">
                      {detail.contentWriter.name}
                    </p>
                    {detail.contentWriter.role && (
                      <p className="text-xs text-gray-500">
                        {detail.contentWriter.role}
                      </p>
                    )}
                    {detail.contentWriter.bio && (
                      <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-gray-600">
                        {detail.contentWriter.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Featured articles */}
            {detail.featuredArticles.length > 0 && (
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-gray-900">
                  {detail.name} Featured Articles
                </h3>
                <ul className="space-y-3">
                  {detail.featuredArticles.map((a) => (
                    <li key={a.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-semibold leading-snug text-gray-800">
                        {a.title}
                      </p>
                      {a.author && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          By {a.author}
                        </p>
                      )}
                      {a.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {a.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Why trust us */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <Shield
                  className="h-4 w-4 text-cv-primary"
                  aria-hidden
                />
                Why trust us?
              </h3>
              <p className="text-xs leading-relaxed text-gray-600">
                CouponValley has a dedicated team sourcing and verifying the
                best {detail.name} coupons, promo codes and deals — so you can
                save money and time while shopping. Our deal hunters constantly
                research the market to provide up-to-date savings, and we make
                sure to read the fine print so you don&apos;t have to. Our team
                last verified offers for {detail.name} on{" "}
                <strong>{lastVerified}</strong>.
              </p>
              <div className="mt-3 space-y-1.5">
                <Link
                  href="/how-it-works"
                  className="block text-xs font-semibold text-cv-primary hover:underline"
                >
                  Learn How We Verify Coupons →
                </Link>
                <Link
                  href="/contact"
                  className="block text-xs font-semibold text-cv-primary hover:underline"
                >
                  Submit a Coupon →
                </Link>
              </div>
            </div>

            {/* About store: contact + description + FAQs */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-gray-900">
                About {detail.name}
              </h3>
              {detail.rating && (
                <div className="mb-2 flex items-center gap-1.5 text-xs">
                  <StarRow rating={Number(detail.rating)} />
                  <span className="font-semibold text-gray-700">
                    {detail.rating} Rating
                  </span>
                  {detail.reviewCount > 0 && (
                    <span className="text-gray-400">
                      ({detail.reviewCount.toLocaleString()})
                    </span>
                  )}
                </div>
              )}
              <ul className="mb-3 space-y-2 text-xs text-gray-600">
                {detail.phone && (
                  <li className="flex items-center gap-2">
                    <Phone
                      className="h-3.5 w-3.5 shrink-0 text-gray-400"
                      aria-hidden
                    />
                    {detail.phone}
                  </li>
                )}
                {detail.address && (
                  <li className="flex items-start gap-2">
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400"
                      aria-hidden
                    />
                    {detail.address}
                  </li>
                )}
              </ul>
              {detail.description && (
                <p className="mb-3 text-xs leading-relaxed text-gray-600">
                  {detail.description.slice(0, 280)}
                  {detail.description.length > 280 && "…"}
                </p>
              )}
              {detail.faqs.length > 0 && (
                <Accordion type="single" collapsible>
                  {detail.faqs.slice(0, 6).map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className="border-t first:border-t-0"
                    >
                      <AccordionTrigger className="py-2 text-left text-xs font-semibold text-gray-800 hover:text-cv-primary hover:no-underline [&>svg]:h-3.5 [&>svg]:w-3.5">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 text-xs leading-relaxed text-gray-600">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>

            {/* Similar stores */}
            {similar.length > 0 && (
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-gray-900">
                  Similar Stores
                </h3>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {similar.slice(0, 18).map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/stores/${s.slug}`}
                        className="text-xs font-medium text-cv-primary hover:underline"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                {similar.length > 18 && (
                  <Link
                    href="/stores"
                    className="mt-3 block text-xs font-semibold text-cv-primary hover:underline"
                  >
                    View All →
                  </Link>
                )}
              </div>
            )}

            {/* Popular stores */}
            {popularStores.length > 0 && (
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-gray-900">
                  Popular Stores
                </h3>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {popularStores.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/stores/${s.slug}`}
                        className="text-xs font-medium text-gray-700 hover:text-cv-primary hover:underline"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/stores"
                  className="mt-3 block text-xs font-semibold text-cv-primary hover:underline"
                >
                  All Stores →
                </Link>
              </div>
            )}
          </aside>

          {/* ── RIGHT MAIN ───────────────────────────────────────────── */}
          <main className="min-w-0">
            {/* H1 + SEO intro */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                {detail.name} Coupons &amp; Promo Codes for {monthYear}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                {introText}
              </p>
            </div>

            {/* Coupon tabs + list */}
            <StoreTypeTabs
              storeSlug={detail.slug}
              initialCoupons={couponsPage.data}
              initialHasMore={couponsPage.page.hasMore}
            />

            {/* ── BELOW-COUPON RICH CONTENT ─────────────────────────── */}

            {/* 1. Coupon summary table */}
            {couponsPage.data.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-3 text-lg font-bold text-gray-900">
                  Current {detail.name} Coupon Codes &amp; Deals
                </h2>
                <div className="overflow-x-auto rounded-xl border shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-cv-primary-soft">
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-cv-primary">
                          Discount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-cv-primary">
                          Offer Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-cv-primary">
                          Expiration Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y bg-white">
                      {couponsPage.data.slice(0, 8).map((c) => (
                        <tr
                          key={c.id}
                          className="transition hover:bg-cv-primary-soft/40"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-bold text-cv-primary">
                            {c.savingsLabel ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{c.title}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                            {c.expiresAt
                              ? new Date(c.expiresAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Two-column editorial: What to Expect + Store Info */}
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {/* What to Expect */}
              <div>
                <p className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  What to expect from
                </p>
                <h2 className="mb-4 text-xl font-extrabold leading-tight text-gray-900">
                  {detail.name} Coupon Codes
                </h2>

                {detail.shortDescription && (
                  <p className="mb-5 text-sm leading-relaxed text-gray-600">
                    {detail.shortDescription}
                  </p>
                )}

                <div className="space-y-5">
                  <EditorialItem
                    n={1}
                    title={`Types of ${detail.name} discount codes available:`}
                    body={generateTypesContent(
                      detail.name,
                      couponsPage.data,
                      detail.stats
                    )}
                  />
                  <EditorialItem
                    n={2}
                    title={`When to shop with a ${detail.name} coupon code:`}
                    body={`${detail.name} maintains active coupons and deals throughout the year. Check back regularly for the latest promo codes — especially during major sale events, holidays, and seasonal clearances when savings tend to be deepest.`}
                  />
                  <EditorialItem
                    n={3}
                    title="Things to watch out for:"
                    body={`Many ${detail.name} deals apply only to specific items or require a minimum purchase amount. Always read the terms and conditions before applying a code. We clearly note eligibility rules, exclusions, and limits so you know exactly what applies before you check out.`}
                  />
                  <EditorialItem
                    n={4}
                    title={`CouponValley's commitment to ${detail.name} savings:`}
                    body={`CouponValley works to ensure every ${detail.name} coupon and promo code is tested and verified before it is featured. Our team reviews offers regularly and removes expired or non-working codes promptly so you always have up-to-date savings.`}
                  />
                </div>
              </div>

              {/* Store Info: FAQ as expanded Q&A */}
              <div>
                <h2 className="mb-4 text-xl font-extrabold text-gray-900">
                  {detail.name} Store Info
                </h2>
                {detail.faqs.length > 0 ? (
                  <div className="space-y-4">
                    {detail.faqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="rounded-xl border bg-white p-4 shadow-sm"
                      >
                        <h3 className="mb-1.5 text-sm font-bold text-gray-900">
                          {faq.question}
                        </h3>
                        <p className="text-sm leading-relaxed text-gray-600">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border bg-white p-5 shadow-sm">
                    {(detail.phone || detail.address) && (
                      <ul className="space-y-2 text-sm text-gray-700">
                        {detail.phone && (
                          <li className="flex items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                            {detail.phone}
                          </li>
                        )}
                        {detail.address && (
                          <li className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                            {detail.address}
                          </li>
                        )}
                      </ul>
                    )}
                    {!detail.phone && !detail.address && (
                      <p className="text-sm text-gray-500">
                        Store information coming soon.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Additional savings ways (top offers as feature cards) */}
            {detail.topOffers.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Best Ways to Save at {detail.name}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {detail.topOffers.map((offer, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm"
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cv-primary-soft">
                        <Tag className="h-3.5 w-3.5 text-cv-primary" aria-hidden />
                      </span>
                      <p className="text-sm font-medium leading-snug text-gray-700">
                        {offer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. About store — full description */}
            {detail.description && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  About {detail.name}
                </h2>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm leading-7 text-gray-600">
                    {detail.description}
                  </p>
                  {(detail.phone || detail.address) && (
                    <div className="mt-5 flex flex-wrap gap-5 border-t pt-4 text-sm text-gray-600">
                      {detail.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-cv-primary" aria-hidden />
                          {detail.phone}
                        </span>
                      )}
                      {detail.address && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-cv-primary" aria-hidden />
                          {detail.address}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Related blog posts */}
            {detail.featuredArticles.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Related Blog Posts
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {detail.featuredArticles.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-xl border bg-white p-5 shadow-sm"
                    >
                      <p className="font-semibold leading-snug text-gray-900">
                        {a.title}
                      </p>
                      {a.author && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          By{" "}
                          <span className="font-medium text-gray-600">
                            {a.author}
                          </span>
                        </p>
                      )}
                      {a.description && (
                        <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                          {a.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 6. Full FAQ accordion */}
            {detail.faqs.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  {detail.name} Frequently Asked Questions
                </h2>
                <div className="rounded-xl border bg-white shadow-sm">
                  <Accordion type="multiple">
                    {detail.faqs.map((faq) => (
                      <AccordionItem
                        key={`main-${faq.id}`}
                        value={`main-${faq.id}`}
                        className="border-b last:border-b-0"
                      >
                        <AccordionTrigger className="px-5 py-4 text-left text-sm font-semibold text-gray-800 hover:text-cv-primary hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-4 text-sm leading-7 text-gray-600">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            )}

            {/* 7. Content writer full card */}
            {detail.contentWriter && (
              <div className="mt-10 flex items-start gap-4 rounded-xl border bg-white p-6 shadow-sm">
                {detail.contentWriter.imageUrl && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-cv-primary-soft bg-cv-primary-soft">
                    <Image
                      src={detail.contentWriter.imageUrl}
                      alt={detail.contentWriter.name}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Page reviewed by
                  </p>
                  <p className="font-bold text-gray-900">
                    {detail.contentWriter.name}
                    {detail.contentWriter.role && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        · {detail.contentWriter.role}
                      </span>
                    )}
                  </p>
                  {detail.contentWriter.bio && (
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {detail.contentWriter.bio}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Mobile-only: sidebar content mirrored below coupons */}
            <div className="mt-10 space-y-5 lg:hidden">
              {/* Mobile stats */}
              {detail.stats && (
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-bold text-gray-900">
                    Offer Statistics
                  </h3>
                  <dl className="grid grid-cols-2 gap-2.5">
                    <StatBox
                      label="Total Offers"
                      value={detail.stats.totalOffers}
                    />
                    <StatBox
                      label="Coupon Codes"
                      value={detail.stats.couponCodes}
                    />
                    <StatBox
                      label="In-Store Coupons"
                      value={detail.stats.inStoreCoupons}
                    />
                    <StatBox
                      label="Free Shipping"
                      value={detail.stats.freeShippingDeals}
                    />
                  </dl>
                </div>
              )}

              {/* Mobile FAQs */}
              {detail.faqs.length > 0 && (
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold text-gray-900">
                    {t("faqs")}
                  </h2>
                  <Accordion type="single" collapsible>
                    {detail.faqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left text-sm font-semibold hover:text-cv-primary hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* Mobile about */}
              {detail.description && (
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <h2 className="mb-2 text-sm font-bold text-gray-900">
                    About {detail.name}
                  </h2>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {detail.description}
                  </p>
                </div>
              )}

              {/* Mobile similar */}
              {similar.length > 0 && (
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold text-gray-900">
                    Similar Stores
                  </h2>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {similar.slice(0, 12).map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/stores/${s.slug}`}
                          className="text-sm font-medium text-cv-primary hover:underline"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mobile content writer */}
              {detail.contentWriter && (
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Page updated by
                  </p>
                  <p className="font-semibold text-gray-900">
                    {detail.contentWriter.name}
                  </p>
                  {detail.contentWriter.role && (
                    <p className="text-xs text-gray-500">
                      {detail.contentWriter.role}
                    </p>
                  )}
                  {detail.contentWriter.bio && (
                    <p className="mt-2 text-sm text-gray-600">
                      {detail.contentWriter.bio}
                    </p>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function StarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < rounded
              ? "fill-cv-accent text-cv-accent"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-cv-primary-soft px-3 py-2.5 text-center">
      <dd className="text-xl font-extrabold text-cv-primary">{value}</dd>
      <dt className="mt-0.5 text-[10px] font-semibold uppercase leading-tight tracking-wide text-gray-500">
        {label}
      </dt>
    </div>
  );
}

function EditorialItem({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: string;
}) {
  return (
    <div>
      <h3 className="mb-1.5 text-sm font-bold text-gray-900">
        {n}. {title}
      </h3>
      <p className="text-sm leading-relaxed text-gray-600">{body}</p>
    </div>
  );
}

function generateTypesContent(
  storeName: string,
  coupons: Array<{ type: string; savingsLabel: string | null }>,
  stats: {
    totalOffers: number;
    couponCodes: number;
    freeShippingDeals: number;
    inStoreCoupons: number;
  } | null
): string {
  const has = (t: string) => coupons.some((c) => c.type === t);
  const parts: string[] = [];
  if (has("CODE"))
    parts.push(
      `${stats?.couponCodes ?? "several"} promo code${(stats?.couponCodes ?? 0) !== 1 ? "s" : ""}`
    );
  if (has("DEAL")) parts.push("limited-time deals");
  if (has("FREE_SHIPPING"))
    parts.push(
      `${stats?.freeShippingDeals ?? "free"} free shipping offer${(stats?.freeShippingDeals ?? 0) !== 1 ? "s" : ""}`
    );
  if (has("IN_STORE"))
    parts.push(
      `${stats?.inStoreCoupons ?? "some"} in-store coupon${(stats?.inStoreCoupons ?? 0) !== 1 ? "s" : ""}`
    );

  const typeStr =
    parts.length === 0
      ? "a variety of discount offers"
      : parts.length === 1
      ? parts[0]
      : parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];

  return (
    `${storeName} savings currently include ${typeStr}. ` +
    `We track a total of ${stats?.totalOffers ?? 0} verified ${storeName} offers, ` +
    `updated regularly so you always have access to the latest working codes and deals.`
  );
}
