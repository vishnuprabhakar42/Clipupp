import { Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type HeroCategory = {
  title: string;
  slug: string;
  description?: string | null;
};

/**
 * Hero band for category detail pages. Small icon left, H1 + description
 * right, optional stat chips below. Faint cv-primary-soft background so
 * the band reads as a hero without competing with the coupon list.
 *
 * Server-rendered; icon defaults to Lucide Tag.
 */
export function CategoryHero({
  category,
  icon: Icon = Tag,
  stats,
}: {
  category: HeroCategory;
  icon?: LucideIcon;
  stats?: Array<{ label: string; value: string | number }>;
}) {
  return (
    <section
      aria-labelledby="category-hero-heading"
      className="border-b border-cv-neutral-200 bg-cv-primary-soft"
    >
      <div className="cv-container py-8 lg:py-12">
        <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-center">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-white text-cv-primary shadow-card lg:h-20 lg:w-20">
            <Icon className="h-8 w-8 lg:h-9 lg:w-9" aria-hidden strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <h1
              id="category-hero-heading"
              className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-cv-neutral-900 lg:text-[2.25rem]"
            >
              {category.title} Coupons & Deals
            </h1>
            {category.description && (
              <p className="cv-body mt-2 max-w-3xl text-cv-neutral-600">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {stats && stats.length > 0 && (
          <ul className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
            {stats.map((s) => (
              <li
                key={s.label}
                className="inline-flex items-center gap-2 rounded-full border border-cv-neutral-200 bg-white px-3 py-1.5 text-[13px]"
              >
                <span className="font-semibold tabular-nums text-cv-neutral-900">
                  {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                </span>
                <span className="text-cv-neutral-500">{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
