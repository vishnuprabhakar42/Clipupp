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
      "Smart shopping guides, money-saving strategies, and store deep-dives from the ClipUpp editorial team. Updated weekly.",
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
    <>
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

      <section className="cv-section-bg-mesh-warm relative overflow-hidden">
        <div className="cv-container py-12 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="cv-eyebrow-vivid mx-auto" style={{ color: "#FFFFFF" }}>
              The Real Deal
            </p>
            <h1 className="cv-display-mega mt-3 text-white">Blog</h1>
            <p className="cv-body mx-auto mt-3 max-w-2xl text-white/90">
              Tips, guides, and insights on saving money and finding the best
              deals online.
            </p>
          </div>
        </div>
      </section>

      <div className="cv-container py-10 md:py-14">
        {hadError ? (
          <p className="text-center text-sm text-cv-danger-strong">
            We couldn&apos;t load articles right now. Please try again in a moment.
          </p>
        ) : articles.length === 0 ? (
          <p className="text-center text-cv-neutral-600">
            No articles published yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="cv-card group flex h-full flex-col overflow-hidden"
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
                    <div className="flex items-center gap-1 cv-meta">
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
                  <h2 className="line-clamp-2 cv-h3 group-hover:text-cv-primary-700">
                    {article.title}
                  </h2>
                  <p className="line-clamp-3 cv-body text-cv-neutral-600">
                    {article.excerpt}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-bold text-cv-primary-700">
                    Read more
                    <ArrowRight
                      className="h-4 w-4 transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
