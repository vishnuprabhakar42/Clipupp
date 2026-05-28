import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { blogApi } from "@/lib/api/blog";
import type { ArticleSummary } from "@/lib/api/blog";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Editorial / blog section. Title comes from the homepage layout config when
 * supplied; the article list is server-fetched from /api/v1/blog.
 *
 * Visual tier (Phase 2): featured article uses `.cv-card-photo-hero` with
 * a dark gradient overlay so the title pops over the image. Side articles
 * use the standard cv-card with hover lift.
 */
export async function BlogSection({
  section,
}: { section?: HomepageSectionPayload | null } = {}) {
  const limit = section?.itemLimit ?? 4;
  const heading = section?.title ?? "The Real Deal";
  const subtitle = section?.subtitle ?? "by ClipUpp";

  let articles: ArticleSummary[] = [];
  try {
    const page = await blogApi.list({ limit });
    articles = (page?.data ?? []) as ArticleSummary[];
  } catch {
    articles = [];
  }

  return (
    <section aria-labelledby="blog-section-heading">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h2 id="blog-section-heading" className="cv-eyebrow-vivid">
            {heading}
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-sm font-medium text-cv-primary-700 hover:underline"
        >
          See all stories →
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="cv-meta text-center">New stories coming soon.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {articles[0] && <FeaturedArticle a={articles[0]} />}
          <div className="flex flex-col gap-4">
            {articles.slice(1, 4).map((a) => (
              <SideArticle key={a.id} a={a} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

type Article = Pick<ArticleSummary, "slug" | "title" | "excerpt" | "heroImageUrl">;

function FeaturedArticle({ a }: { a: Article }) {
  return (
    <Link
      href={`/blog/${a.slug}`}
      className="cv-card-photo-hero group relative block h-full min-h-[280px] overflow-hidden"
    >
      <div className="absolute inset-0 bg-cv-neutral-200">
        {a.heroImageUrl ? (
          <Image
            src={a.heroImageUrl}
            alt={a.title}
            fill
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center font-display text-2xl text-cv-neutral-400">
            ClipUpp
          </div>
        )}
      </div>
      {/* Overlay handled by .cv-card-photo-hero ::after */}
      <div className="relative z-[1] flex h-full flex-col justify-end gap-2 p-6">
        <p className="cv-eyebrow-vivid" style={{ color: "#FFFFFF" }}>
          <BookOpen
            className="mr-1.5 inline h-3 w-3"
            aria-hidden
            strokeWidth={2.5}
          />
          Featured Guide
        </p>
        <h3 className="cv-display-hero text-white text-[1.5rem] lg:text-[1.875rem]">
          {a.title}
        </h3>
        <p className="cv-body line-clamp-2 text-white/85">{a.excerpt}</p>
        <span className="inline-flex items-center gap-1 pt-1 font-display text-sm font-extrabold text-white group-hover:underline">
          Read story
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}

function SideArticle({ a }: { a: Article }) {
  return (
    <Link
      href={`/blog/${a.slug}`}
      className="cv-card group flex gap-3 p-3"
    >
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-cv-neutral-100">
        {a.heroImageUrl ? (
          <Image
            src={a.heroImageUrl}
            alt={a.title}
            fill
            sizes="112px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-xs text-cv-neutral-400">
            CV
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 self-center">
        <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.12em] text-cv-primary-700">
          Saving Tips
        </p>
        <h4 className="line-clamp-2 cv-h3 group-hover:text-cv-primary-700">
          {a.title}
        </h4>
        <p className="cv-meta line-clamp-1">{a.excerpt}</p>
      </div>
    </Link>
  );
}
