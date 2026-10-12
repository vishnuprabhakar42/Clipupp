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
