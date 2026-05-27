import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CalendarIcon, ArrowRight } from "lucide-react";
import { blogApi } from "@/lib/api/blog";
import { isApiError } from "@/lib/api/errors";
import { JsonLd } from "@/lib/seo/jsonLd";
import { itemListSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/meta";
import { canonicalFor } from "@/lib/seo/urls";
import type { Locale } from "@/lib/i18n/config";

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: "Blog — Money-saving tips & shopping guides",
    description:
      "Smart shopping guides, money-saving strategies, and store deep-dives from the CouponValley editorial team. Updated weekly.",
    path: "/blog",
    locale,
  });
}

export const revalidate = 300;

export default async function BlogPage({
  params,
}: {
  params: Params;
}) {
  const { locale } = await params;
  let articles: Awaited<ReturnType<typeof blogApi.list>>["data"] = [];
  let hadError = false;
  try {
    const page = await blogApi.list({ limit: 24 });
    articles = page.data;
  } catch (err) {
    hadError = !(isApiError(err) && err.status === 404);
  }

  const listUrl = canonicalFor("/blog", locale);

  return (
    <div className="container py-8 md:py-12">
      {articles.length > 0 && (
        <JsonLd
          id="ld-itemlist"
          data={itemListSchema({
            url: listUrl,
            name: "Blog articles",
            entries: articles.map((a) => ({
              url: canonicalFor(`/blog/${a.slug}`, locale),
              name: a.title,
            })),
          })}
        />
      )}
      <header className="mx-auto mb-10 max-w-3xl text-center">
        <h1 className="cv-gradient-text text-3xl font-bold tracking-tight md:text-4xl">
          Blog
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Discover tips, guides, and insights on how to save money and find the best deals online.
        </p>
      </header>

      {hadError ? (
        <p className="text-center text-sm text-destructive">
          We couldn&apos;t load articles right now. Please try again in a moment.
        </p>
      ) : articles.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No articles published yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-lg border border-cv-neutral-200 bg-white shadow-card"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-cv-neutral-100">
                {article.heroImageUrl ? (
                  <Image
                    src={article.heroImageUrl}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-cv-neutral-400">
                    No image
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-5">
                {article.publishedAt && (
                  <div className="flex items-center gap-1 text-xs text-cv-neutral-500">
                    <CalendarIcon className="h-3 w-3" aria-hidden />
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <h2 className="line-clamp-2 text-lg font-bold leading-snug text-gray-900 group-hover:text-cv-primary">
                  {article.title}
                </h2>
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-cv-primary">
                  Read more
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
