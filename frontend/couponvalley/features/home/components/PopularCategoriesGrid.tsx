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

// 6-color gradient disc cycle — deterministic by tile index so re-renders
// don't shuffle colours mid-session. Each entry combines a Tailwind gradient
// utility (cv-* tokens) with a matching glow class.
const DISC_CYCLE: Array<{ bg: string; glow: string }> = [
  { bg: "cv-gradient-hero",    glow: "shadow-glow-primary" },
  { bg: "cv-gradient-warm",    glow: "shadow-glow-accent" },
  { bg: "cv-gradient-success", glow: "shadow-glow-success" },
  { bg: "cv-gradient-cool",    glow: "shadow-glow-primary" },
  { bg: "cv-gradient-savings", glow: "shadow-glow-accent" },
  { bg: "cv-gradient-rainbow", glow: "shadow-glow-primary" },
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
 *
 * Visual tier (Phase 2): cv-card tiles with 6-color rotating gradient icon
 * discs (positioned by index), Manrope-bold titles, soft hover lift. Section
 * sits on `cv-section-bg-primary-soft` (the page wires the band).
 */
export async function PopularCategoriesGrid({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Popular Categories";
  const limit = section?.itemLimit ?? 12;
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
      <div className="mb-7 flex items-end justify-between gap-3">
        <div>
          <p className="cv-eyebrow-vivid">Shop by category</p>
          <h2 id="popular-categories-heading" className="cv-h2 mt-2">
            {heading}
          </h2>
        </div>
        <Link
          href="/categories"
          className="text-sm font-bold text-cv-primary-700 hover:underline"
        >
          See all →
        </Link>
      </div>

      {cats.length === 0 ? (
        <p className="cv-meta">No categories yet.</p>
      ) : (
        <ul className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cats.slice(0, limit).map((c, i) => {
            const Icon = styleFor(c.slug, c.title);
            const disc = DISC_CYCLE[i % DISC_CYCLE.length];
            return (
              <li key={c.id} className="h-full">
                <Link
                  href={`/categories/${c.slug}`}
                  className="cv-card group flex h-full flex-col items-center gap-3 p-4 text-center"
                >
                  <span
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white ${disc.bg} ${disc.glow}`}
                  >
                    <Icon className="h-6 w-6" aria-hidden strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="cv-h3 line-clamp-1 group-hover:text-cv-primary-700">
                      {c.title}
                    </p>
                    <p className="cv-meta mt-0.5 line-clamp-1">
                      {c.childrenCount > 0
                        ? `${c.childrenCount} subcategor${c.childrenCount === 1 ? "y" : "ies"}`
                        : "Coupons & deals"}
                    </p>
                  </div>
                  <ArrowRight
                    className="ml-auto mt-auto h-4 w-4 shrink-0 text-cv-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-cv-primary-700"
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
