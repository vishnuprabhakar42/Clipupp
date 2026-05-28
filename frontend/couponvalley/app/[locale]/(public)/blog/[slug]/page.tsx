import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { blogApi, type ArticleSummary } from "@/lib/api/blog";
import { isApiError } from "@/lib/api/errors";
import { MarkdownView } from "@/features/admin/components/MarkdownView";
import { JsonLd } from "@/lib/seo/jsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/meta";
import { canonicalFor, siteUrl } from "@/lib/seo/urls";
import { locales, type Locale } from "@/lib/i18n/config";

export const revalidate = 600; // 10 min — blog posts change infrequently.

type Params = Promise<{ locale: Locale; slug: string }>;

/**
 * Pre-render every published blog post at build time. Walks the cursor a few
 * pages so the build covers the full archive even as it grows. Anything
 * outside this window still works on-demand via ISR.
 */
export async function generateStaticParams() {
  try {
    const slugs: string[] = [];
    let cursor: string | undefined;
    for (let i = 0; i < 5; i++) {
      const page = await blogApi.list({ cursor, limit: 100 });
      for (const a of page.data ?? []) slugs.push(a.slug);
      cursor = page.page.nextCursor ?? undefined;
      if (!cursor) break;
    }
    return locales.flatMap((locale) =>
      slugs.map((slug) => ({ locale, slug }))
    );
  } catch {
    return [];
  }
}

async function loadArticle(slug: string) {
  try {
    return await blogApi.bySlug(slug);
  } catch (err) {
    if (isApiError(err) && err.status === 404) return null;
    throw err;
  }
}

async function safeRelated(currentSlug: string): Promise<ArticleSummary[]> {
  try {
    const page = await blogApi.list({ limit: 6 });
    return (page.data ?? []).filter((a) => a.slug !== currentSlug).slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await loadArticle(slug);
  if (!article)
    return { title: "Article not found", robots: { index: false } };
  return buildMetadata({
    title: article.metaTitle ?? article.title,
    description: article.metaDescription ?? article.excerpt,
    path: `/blog/${article.slug}`,
    locale,
    ogType: "article",
    image: article.heroImageUrl ?? undefined,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Params;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [article, related] = await Promise.all([
    loadArticle(slug),
    safeRelated(slug),
  ]);
  if (!article) notFound();

  const url = canonicalFor(`/blog/${article.slug}`, locale);
  const homeUrl = canonicalFor("/", locale);
  const blogUrl = canonicalFor("/blog", locale);
  const publishedAt = article.publishedAt ?? new Date().toISOString();

  const readTimeMinutes = estimateReadingMinutes(article.bodyMd);

  return (
    <>
      <JsonLd
        id="ld-article"
        data={articleSchema({
          url,
          headline: article.title,
          description: article.excerpt,
          imageUrl: article.heroImageUrl,
          datePublished: publishedAt,
          dateModified: publishedAt,
          author: article.author
            ? {
                name: article.author.name,
                imageUrl: article.author.avatarUrl ?? undefined,
              }
            : undefined,
          publisherUrl: siteUrl(),
        })}
      />
      <JsonLd
        id="ld-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", url: homeUrl },
          { name: "Blog", url: blogUrl },
          { name: article.title, url },
        ])}
      />

      <article className="bg-white">
        {/* Header band: breadcrumb-style category placeholder, H1, byline */}
        <header className="cv-container pt-10 lg:pt-14">
          <p className="cv-tag bg-transparent px-0 text-cv-primary">
            Editorial
          </p>
          <h1 className="cv-h1 mt-2 max-w-3xl">{article.title}</h1>
          <p className="cv-body mt-4 max-w-3xl text-cv-neutral-600">
            {article.excerpt}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-cv-neutral-500">
            {article.author && (
              <span className="inline-flex items-center gap-2">
                {article.author.avatarUrl && (
                  <span className="relative h-8 w-8 overflow-hidden rounded-full border border-cv-neutral-200 bg-cv-neutral-100">
                    <Image
                      src={article.author.avatarUrl}
                      alt={article.author.name}
                      width={32}
                      height={32}
                      sizes="32px"
                      className="h-full w-full object-cover"
                    />
                  </span>
                )}
                <span>
                  By{" "}
                  <span className="font-semibold text-cv-neutral-900">
                    {article.author.name}
                  </span>
                </span>
              </span>
            )}
            {article.publishedAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {new Date(article.publishedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {readTimeMinutes > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {readTimeMinutes} min read
              </span>
            )}
          </div>
        </header>

        {/* Hero image — fixed 16:9 aspect parent so CLS stays 0 even when
            the image is slow / missing. priority + fetchPriority high to
            promote it as the LCP candidate. */}
        {article.heroImageUrl && (
          <div className="cv-container mt-8 lg:mt-10">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-cv-neutral-100">
              <Image
                src={article.heroImageUrl}
                alt={article.title}
                fill
                sizes="(min-width: 1280px) 1120px, 100vw"
                priority
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Body — cv-prose-constrained markdown render. The MarkdownView
            wrapper uses react-markdown + remark-gfm so the output is safe
            (no raw HTML) and supports tables / task lists / strikethrough. */}
        <div className="cv-container py-10 lg:py-14">
          <div className="cv-prose prose prose-cv max-w-[680px] text-[1rem] leading-[1.75] text-cv-neutral-800
                          prose-headings:font-display prose-headings:tracking-tight prose-headings:text-cv-neutral-900
                          prose-h2:mt-10 prose-h2:text-[1.5rem] prose-h2:font-bold
                          prose-h3:mt-8 prose-h3:text-[1.125rem] prose-h3:font-semibold
                          prose-p:mt-4
                          prose-a:font-semibold prose-a:text-cv-primary hover:prose-a:underline
                          prose-strong:text-cv-neutral-900
                          prose-ul:mt-3 prose-ul:list-disc prose-ul:pl-5
                          prose-ol:mt-3 prose-ol:list-decimal prose-ol:pl-5
                          prose-li:mt-1.5
                          prose-blockquote:border-l-4 prose-blockquote:border-cv-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-cv-neutral-700
                          prose-img:rounded-md">
            <MarkdownView source={article.bodyMd} />
          </div>
        </div>

        {/* Related posts rail — flat 3-up card row. Defaults to nothing if
            the backend returns 0 other posts. */}
        {related.length > 0 && (
          <aside
            aria-labelledby="related-articles-heading"
            className="border-t border-cv-neutral-200 bg-cv-neutral-50"
          >
            <div className="cv-container cv-section">
              <h2 id="related-articles-heading" className="cv-h2">
                More from the blog
              </h2>
              <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((a) => (
                  <li key={a.id}>
                    <RelatedArticleCard article={a} />
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </article>
    </>
  );
}

function RelatedArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-cv-neutral-200 bg-white shadow-card"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-cv-neutral-100">
        {article.heroImageUrl ? (
          <Image
            src={article.heroImageUrl}
            alt={article.title}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-cv-neutral-400">
            ClipUpp
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {article.publishedAt && (
          <p className="cv-meta">
            {new Date(article.publishedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
        <h3 className="line-clamp-2 cv-h3 group-hover:text-cv-primary">
          {article.title}
        </h3>
        <p className="line-clamp-3 cv-body text-cv-neutral-600">
          {article.excerpt}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-cv-primary">
          Read story
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/**
 * Rough reading-time estimate based on a 200-words-per-minute pace. Used
 * for the byline's "X min read" hint. Returns 0 when bodyMd is empty so
 * the hint hides entirely.
 */
function estimateReadingMinutes(bodyMd: string | null | undefined): number {
  if (!bodyMd) return 0;
  const words = bodyMd.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  return Math.max(1, Math.round(words / 200));
}
