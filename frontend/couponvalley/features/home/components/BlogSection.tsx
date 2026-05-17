"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { blogApi } from "@/lib/api/blog";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Editorial / blog section. Title/subtitle come from the homepage layout
 * config when supplied; the article list is always fetched from /api/v1/blog
 * (which has its own cache).
 */
export function BlogSection({ section }: { section?: HomepageSectionPayload | null } = {}) {
  const limit = section?.itemLimit ?? 4;
  const q = useQuery({
    queryKey: ["home", "blog-feed", limit],
    queryFn: () => blogApi.list({ limit }),
    staleTime: 5 * 60_000,
  });

  const articles = q.data?.data ?? [];

  return (
    <section
      aria-labelledby="blog-section-heading"
      className="rounded-md bg-gradient-to-br from-cv-primary-soft via-cv-primary-soft/60 to-white px-5 py-10 sm:px-10"
    >
      {/* Brand strip */}
      <div className="mb-8 flex items-center justify-center gap-3 text-center">
        <span
          className="rounded-md bg-cv-primary-soft px-3 py-1 text-2xl font-extrabold uppercase tracking-tight text-cv-primary"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          The Real Deal
        </span>
        <span
          className="text-sm italic text-cv-primary"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          by CouponValley
        </span>
      </div>

      {q.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="cv-skeleton h-[360px] rounded-md" />
          <div className="space-y-4">
            <div className="cv-skeleton h-[105px] rounded-md" />
            <div className="cv-skeleton h-[105px] rounded-md" />
            <div className="cv-skeleton h-[105px] rounded-md" />
          </div>
        </div>
      ) : articles.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          New stories coming soon.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Featured article */}
          {articles[0] && <FeaturedArticle a={articles[0]} />}

          {/* Sidebar list */}
          <div className="flex flex-col gap-4">
            {articles.slice(1, 4).map((a) => (
              <SideArticle key={a.id} a={a} />
            ))}
            <Link
              href="/blog"
              className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-cv-primary hover:underline"
            >
              See all stories
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function FeaturedArticle({ a }: { a: { slug: string; title: string; excerpt: string; heroImageUrl: string | null } }) {
  return (
    <Link
      href={`/blog/${a.slug}`}
      className="group block overflow-hidden rounded-md bg-cv-accent-soft transition hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-cv-accent-soft">
        {a.heroImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.heroImageUrl}
              alt={a.title}
              className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-2xl text-cv-accent/70">
            CouponValley
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-700">
          Featured Guide
        </p>
        <h3 className="text-xl font-bold leading-tight text-gray-900 group-hover:text-cv-primary">
          {a.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
        <span className="inline-flex items-center gap-1 pt-1 text-sm font-semibold text-cv-primary">
          Learn More
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

function SideArticle({ a }: { a: { slug: string; title: string; excerpt: string; heroImageUrl: string | null } }) {
  return (
    <Link
      href={`/blog/${a.slug}`}
      className="group flex gap-3 rounded-md bg-white p-3 transition hover:shadow-md"
    >
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md ring-2 ring-cv-accent/30">
        {a.heroImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.heroImageUrl}
              alt={a.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-cv-primary-soft text-xs text-cv-primary">
            CV
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 self-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-700">
          Saving Tips
        </p>
        <h4 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 group-hover:text-cv-primary">
          {a.title}
        </h4>
        <p className="line-clamp-1 text-xs text-muted-foreground">{a.excerpt}</p>
      </div>
    </Link>
  );
}
