import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { blogApi } from "@/lib/api/blog";
import type { ArticleSummary } from "@/lib/api/blog";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Editorial / blog section. Title comes from the homepage layout config when
 * supplied; the article list is server-fetched from /api/v1/blog. Flat cards
 * on a neutral surface, single shadow level, 16:9 hero images.
 */
export async function BlogSection({
  section,
}: { section?: HomepageSectionPayload | null } = {}) {
  const limit = section?.itemLimit ?? 4;
  const heading = section?.title ?? "The Real Deal";
  const subtitle = section?.subtitle ?? "by CouponValley";

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
          <p className="cv-tag bg-transparent px-0 text-cv-primary">{subtitle}</p>
          <h2 id="blog-section-heading" className="cv-h2 mt-2">
            {heading}
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-sm font-semibold text-cv-primary hover:underline"
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
      className="group block overflow-hidden rounded-lg border border-cv-neutral-200 bg-white shadow-card"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-cv-neutral-100">
        {a.heroImageUrl ? (
          <Image
            src={a.heroImageUrl}
            alt={a.title}
            fill
            sizes="(min-width: 1024px) 720px, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center font-display text-2xl text-cv-neutral-400">
            CouponValley
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-5">
        <p className="cv-tag bg-transparent px-0">Featured Guide</p>
        <h3 className="cv-h3 group-hover:text-cv-primary">{a.title}</h3>
        <p className="cv-body line-clamp-2 text-cv-neutral-600">{a.excerpt}</p>
        <span className="inline-flex items-center gap-1 pt-1 text-sm font-semibold text-cv-primary">
          Read story
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

function SideArticle({ a }: { a: Article }) {
  return (
    <Link
      href={`/blog/${a.slug}`}
      className="group flex gap-3 rounded-lg border border-cv-neutral-200 bg-white p-3 shadow-card"
    >
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-cv-neutral-100">
        {a.heroImageUrl ? (
          <Image
            src={a.heroImageUrl}
            alt={a.title}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-xs text-cv-neutral-400">
            CV
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 self-center">
        <p className="cv-tag bg-transparent px-0">Saving Tips</p>
        <h4 className="line-clamp-2 cv-h3 group-hover:text-cv-primary">{a.title}</h4>
        <p className="cv-meta line-clamp-1">{a.excerpt}</p>
      </div>
    </Link>
  );
}
