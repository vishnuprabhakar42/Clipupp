import { Link } from "@/lib/i18n/navigation";

type SubChip = { id: string; slug: string; title: string };

/**
 * Pill row of subcategories on category-detail pages. Each chip links to
 * the child's own category page (we don't try to filter-in-place — that
 * would create thin duplicate-content pages; clean separate URLs index
 * cleanly). Renders nothing when no children.
 */
export function SubcategoryChips({
  parentTitle,
  subcategories,
}: {
  parentTitle: string;
  /** Renamed from `children` to avoid React's reserved children-prop rule. */
  subcategories: SubChip[];
}) {
  if (!subcategories || subcategories.length === 0) return null;
  return (
    <nav
      aria-label={`${parentTitle} subcategories`}
      className="mt-6 flex flex-wrap items-center gap-2"
    >
      <span className="cv-meta uppercase tracking-[0.04em]">Browse:</span>
      {subcategories.map((c) => (
        <Link
          key={c.id}
          href={`/categories/${c.slug}`}
          className="rounded-full border border-cv-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-cv-neutral-700 transition-colors hover:border-cv-primary hover:text-cv-primary"
        >
          {c.title}
        </Link>
      ))}
    </nav>
  );
}
