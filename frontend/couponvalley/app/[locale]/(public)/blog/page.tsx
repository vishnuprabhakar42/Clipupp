import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CalendarIcon, ArrowRight } from "lucide-react";
import { blogApi } from "@/lib/api/blog";
import { isApiError } from "@/lib/api/errors";

export const metadata: Metadata = {
  title: "Blog · Money-saving tips & shopping guides | CouponValley",
  description:
    "Smart shopping guides, money-saving strategies, and store deep-dives from the CouponValley editorial team. Updated weekly.",
  alternates: {
    canonical: "/blog",
    languages: { en: "/blog", hi: "/hi/blog", "x-default": "/blog" },
  },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "CouponValley Blog — Money-saving tips",
    description:
      "Smart shopping guides, money-saving strategies, and store deep-dives. Updated weekly.",
    siteName: "CouponValley",
  },
  twitter: {
    card: "summary_large_image",
    title: "CouponValley Blog",
    description: "Smart shopping guides + money-saving strategies.",
  },
};

export const revalidate = 300;

export default async function BlogPage() {
  let articles: Awaited<ReturnType<typeof blogApi.list>>["data"] = [];
  let hadError = false;
  try {
    const page = await blogApi.list({ limit: 24 });
    articles = page.data;
  } catch (err) {
    hadError = !(isApiError(err) && err.status === 404);
  }

  return (
    <div className="container py-8 md:py-12">
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
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              {/* Hero image — fixed 16:9 aspect, object-cover for atmospheric photos. */}
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

              {/* Body — flex-col so the "Read more" CTA pins to bottom. */}
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
