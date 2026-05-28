import { Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type HeroCategory = {
  title: string;
  slug: string;
  description?: string | null;
};

/**
 * Hero band for category detail pages. Fade-down background (white → primary
 * soft), gradient icon disc on the left, H1 + description on the right.
 * Softer than store / coupon mesh heroes — signals "browse / discovery"
 * rather than "checkout / claim."
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
      className="clipupp-section-bg-fade-down relative overflow-hidden border-b border-clipupp-neutral-200"
    >
      <div className="clipupp-container py-10 lg:py-14">
        <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:gap-7">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-clipupp-primary-soft text-clipupp-primary lg:h-24 lg:w-24">
            <Icon className="h-9 w-9 lg:h-11 lg:w-11" aria-hidden strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="clipupp-eyebrow-vivid">Category</p>
            <h1 id="category-hero-heading" className="clipupp-display-hero mt-2">
              {category.title} Coupons &amp; Deals
            </h1>
            {category.description && (
              <p className="clipupp-body mt-3 max-w-3xl">{category.description}</p>
            )}
          </div>
        </div>

        {stats && stats.length > 0 && (
          <ul className="mt-7 flex flex-wrap items-center gap-2">
            {stats.map((s) => (
              <li key={s.label} className="clipupp-btn-soft-pill text-[13px]">
                <span className="font-extrabold tabular-nums text-clipupp-primary-800">
                  {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                </span>
                <span className="text-clipupp-primary-700">{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
