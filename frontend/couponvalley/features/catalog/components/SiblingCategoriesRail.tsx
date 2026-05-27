import { Link } from "@/lib/i18n/navigation";
import { categoriesApi } from "@/lib/api/categories";
import { ScrollRail } from "@/components/site/ScrollRail";

type Sibling = { id: string; slug: string; title: string };

/**
 * Horizontal rail of sibling categories (same parent_id) on a category
 * detail page. For top-level categories, siblings = other top-level
 * categories. For child categories, siblings = other children of the
 * same parent.
 *
 * Server-fetches the whole tree once via /api/v1/categories (cached
 * 5m+SWR 30m on the backend) and locates siblings in-memory. Renders
 * nothing if siblings count <= 1.
 */
export async function SiblingCategoriesRail({ currentSlug }: { currentSlug: string }) {
  let siblings: Sibling[] = [];
  try {
    const tree = await categoriesApi.tree();
    siblings = findSiblings(tree, currentSlug);
  } catch {
    return null;
  }
  if (siblings.length <= 1) return null;

  // Exclude the current category from the rail — it's the page we're on.
  const others = siblings.filter((c) => c.slug !== currentSlug);
  if (others.length === 0) return null;

  return (
    <section aria-labelledby="sibling-categories-heading" className="cv-section">
      <div className="mb-5">
        <h2 id="sibling-categories-heading" className="cv-h2">
          More categories to explore
        </h2>
      </div>
      <ScrollRail ariaLabel="Sibling categories" className="gap-3">
        {others.map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className="flex h-[64px] w-[200px] shrink-0 snap-start items-center justify-center rounded-lg border border-cv-neutral-200 bg-white px-4 text-center text-sm font-semibold text-cv-neutral-700 transition-colors hover:border-cv-primary hover:text-cv-primary"
          >
            {c.title}
          </Link>
        ))}
      </ScrollRail>
    </section>
  );
}

type TreeNode = {
  id: string;
  slug: string;
  title: string;
  children?: TreeNode[];
};

/**
 * Locate the siblings of `currentSlug` in a flat tree. A category's
 * siblings are: other entries in the same children[] array (if it's a
 * child node), or other top-level nodes (if it's a top-level category).
 */
function findSiblings(tree: TreeNode[], currentSlug: string): Sibling[] {
  const top = (tree ?? []).map((n) => ({ id: n.id, slug: n.slug, title: n.title }));
  // Is currentSlug a top-level category?
  if (top.some((n) => n.slug === currentSlug)) return top;
  // Otherwise it's a child — find the parent.
  for (const parent of tree ?? []) {
    const children = parent.children ?? [];
    if (children.some((c) => c.slug === currentSlug)) {
      return children.map((c) => ({ id: c.id, slug: c.slug, title: c.title }));
    }
  }
  return [];
}
