"use client";

import { Link } from "@/lib/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
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

/**
 * Eye-catching "Popular Categories" — colored icon cards. Each tile gets:
 *   • Pastel-tinted background with a coordinated icon-circle
 *   • Bold category title + short hook ("X stores", "Y deals")
 * The flat 4-column text list previously here looked like a sitemap, not a
 * shoppable section — these tiles fix that.
 */

const CATEGORY_THEMES: Array<{
  match: string[];
  icon: LucideIcon;
  bg: string;
  iconBg: string;
  iconColor: string;
}> = [
  { match: ["electron", "tech", "gadget"], icon: Laptop,
    bg: "bg-cv-primary-soft", iconBg: "bg-cv-primary", iconColor: "text-white" },
  { match: ["fashion", "cloth", "apparel"], icon: Shirt,
    bg: "bg-cv-primary-soft", iconBg: "bg-cv-primary", iconColor: "text-white" },
  { match: ["food", "grocery", "dining"], icon: UtensilsCrossed,
    bg: "bg-cv-primary-soft", iconBg: "bg-cv-primary", iconColor: "text-white" },
  { match: ["travel", "flight", "hotel"], icon: Plane,
    bg: "bg-cv-primary-soft", iconBg: "bg-cv-primary", iconColor: "text-white" },
  { match: ["beauty", "health", "wellness"], icon: Sparkles,
    bg: "bg-cv-primary-soft", iconBg: "bg-cv-primary", iconColor: "text-white" },
  { match: ["sport", "fitness"], icon: Dumbbell,
    bg: "bg-cv-primary-soft", iconBg: "bg-cv-primary", iconColor: "text-white" },
  { match: ["home", "kitchen", "furniture"], icon: Home,
    bg: "bg-cv-primary-soft", iconBg: "bg-cv-primary", iconColor: "text-white" },
  { match: ["book", "education"], icon: BookOpen,
    bg: "bg-cv-primary-soft", iconBg: "bg-cv-primary", iconColor: "text-white" },
  { match: ["finance", "card", "bank"], icon: CreditCard,
    bg: "bg-cv-primary-soft", iconBg: "bg-cv-primary", iconColor: "text-white" },
];

function styleFor(slug: string, title: string) {
  const text = `${slug} ${title}`.toLowerCase();
  for (const t of CATEGORY_THEMES) {
    if (t.match.some((m) => text.includes(m))) return t;
  }
  return {
    icon: Tag,
    bg: "bg-cv-primary-soft",
    iconBg: "bg-cv-primary",
    iconColor: "text-white",
  };
}

export function PopularCategoriesGrid({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading = section?.title ?? "Popular Categories";
  const limit = section?.itemLimit ?? 10;
  const featured = section?.categories;

  const q = useQuery({
    queryKey: ["home", "popular-categories"],
    queryFn: () => categoriesApi.tree(),
    staleTime: 10 * 60_000,
    enabled: !featured || featured.length === 0,
  });

  const cats: CategoryTile[] = featured && featured.length > 0
    ? featured.map((c) => ({ id: c.slug, slug: c.slug, title: c.title, childrenCount: 0 }))
    : (q.data ?? []).map((c) => ({ id: c.id, slug: c.slug, title: c.title, childrenCount: c.children.length }));

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

      {!featured && q.isLoading ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: limit }).map((_, i) => (
            <li key={i} className="cv-skeleton h-28 rounded-lg" />
          ))}
        </ul>
      ) : cats.length === 0 ? (
        <p className="cv-meta">No categories yet.</p>
      ) : (
        <ul className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {cats.slice(0, limit).map((c) => {
            const { icon: Icon } = styleFor(c.slug, c.title);
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
