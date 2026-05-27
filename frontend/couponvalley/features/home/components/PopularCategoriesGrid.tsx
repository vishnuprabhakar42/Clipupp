import { Link } from "@/lib/i18n/navigation";
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  Dumbbell,
  Home,
  Laptop,
  Plane,
  Shirt,
  Sparkles,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { categoriesApi } from "@/lib/api/categories";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

type CategoryTile = { id: string; slug: string; title: string; childrenCount: number };

const CATEGORY_THEMES: Array<{
  match: string[];
  icon: LucideIcon;
}> = [
  { match: ["electron", "tech", "gadget"], icon: Laptop },
  { match: ["fashion", "cloth", "apparel"], icon: Shirt },
  { match: ["food", "grocery", "dining"], icon: UtensilsCrossed },
  { match: ["travel", "flight", "hotel"], icon: Plane },
  { match: ["beauty", "health", "wellness"], icon: Sparkles },
  { match: ["sport", "fitness"], icon: Dumbbell },
  { match: ["home", "kitchen", "furniture"], icon: Home },
  { match: ["book", "education"], icon: BookOpen },
  { match: ["finance", "card", "bank"], icon: CreditCard },
];

function styleFor(slug: string, title: string): LucideIcon {
  const text = `${slug} ${title}`.toLowerCase();
  for (const t of CATEGORY_THEMES) {
    if (t.match.some((m) => text.includes(m))) return t.icon;
  }
  return Tag;
}

/**
 * "Popular Categories" — iconic tile grid. Server-rendered. Prefers
 * `section.categories` from the homepage payload; falls back to
 * `categoriesApi.tree()` when no admin pins exist.
 */
export async function PopularCategoriesGrid({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Popular Categories";
  const limit = section?.itemLimit ?? 10;
  const featured = section?.categories;

  let cats: CategoryTile[] = [];
  if (featured && featured.length > 0) {
    cats = featured.map((c) => ({
      id: c.slug,
      slug: c.slug,
      title: c.title,
      childrenCount: 0,
    }));
  } else {
    try {
      const tree = await categoriesApi.tree();
      cats = (tree ?? []).map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        childrenCount: c.children.length,
      }));
    } catch {
      cats = [];
    }
  }

  return (
    <section aria-labelledby="popular-categories-heading">
      <div className="mb-6 flex items-end justify-between gap-3">
        <h2 id="popular-categories-heading" className="cv-h2">
          {heading}
        </h2>
        <Link href="/categories" className="text-sm font-semibold text-cv-primary hover:underline">
          See all →
        </Link>
      </div>

      {cats.length === 0 ? (
        <p className="cv-meta">No categories yet.</p>
      ) : (
        <ul className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cats.slice(0, limit).map((c) => {
            const Icon = styleFor(c.slug, c.title);
            return (
              <li key={c.id} className="h-full">
                <Link
                  href={`/categories/${c.slug}`}
                  className="group flex h-full flex-col items-center gap-3 rounded-lg border border-cv-neutral-200 bg-white p-4 text-center shadow-card transition-colors hover:border-cv-primary"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-cv-primary-soft">
                    <Icon className="h-5 w-5 text-cv-primary" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="cv-h3 line-clamp-1">{c.title}</p>
                    <p className="cv-meta mt-0.5 line-clamp-1">
                      {c.childrenCount > 0
                        ? `${c.childrenCount} subcategor${c.childrenCount === 1 ? "y" : "ies"}`
                        : "Coupons & deals"}
                    </p>
                  </div>
                  <ArrowRight
                    className="ml-auto mt-auto h-4 w-4 shrink-0 text-cv-neutral-300 group-hover:text-cv-primary"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
