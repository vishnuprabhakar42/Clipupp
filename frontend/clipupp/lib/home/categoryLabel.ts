import type { FeedCategory } from "./feed";

/** Short single-word label: "Beauty & Personal Care" -> "Beauty". */
export function shortCategoryLabel(name: string): string {
  const first = name.split(/\s*(?:&|\/|\band\b)\s*/i)[0]?.trim();
  return first || name;
}

/** Root categories (plus hot ones) when the feed carries hierarchy info, otherwise all. */
export function rootCategories<T extends Pick<FeedCategory, "parent" | "hot">>(cats: T[]): T[] {
  const hasHierarchy = cats.some((c) => c.parent === null);
  return hasHierarchy ? cats.filter((c) => c.parent === null || c.hot) : cats;
}

/**
 * Root slug for a category: itself when it is a root or has no known parent,
 * else its `parent`. Used to turn leaf coupon categories into root chips.
 */
export function rootCategoryOf(slug: string, cats: Pick<FeedCategory, "id" | "parent">[]): string {
  const c = cats.find((x) => x.id === slug);
  return c?.parent && cats.some((x) => x.id === c.parent) ? c.parent : slug;
}
