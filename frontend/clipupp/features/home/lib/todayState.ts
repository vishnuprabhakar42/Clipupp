export type ListState<T> = { items: T[]; cursor: string | null; hasMore: boolean; error: boolean };
export type PageResult<T> = { ok: boolean; items: T[]; nextCursor: string | null };

/** Treat a rejected server action like a failed page. */
export async function safeLoad<T>(load: () => Promise<PageResult<T>>): Promise<PageResult<T>> {
  try {
    return await load();
  } catch {
    return { ok: false, items: [], nextCursor: null };
  }
}

/**
 * Fold a page result into the list. A failed reset empties the list (the old
 * tab's rows and cursor must not leak into a retry); a failed append keeps it.
 */
export function applyPage<T extends { coupon: { id: string } }>(
  prev: ListState<T>,
  mode: "reset" | "append",
  page: PageResult<T>,
): ListState<T> {
  if (!page.ok) {
    return mode === "reset" ? { items: [], cursor: null, hasMore: false, error: true } : { ...prev, error: true };
  }
  const items =
    mode === "reset"
      ? page.items
      : (() => {
          const seen = new Set(prev.items.map((p) => p.coupon.id));
          return [...prev.items, ...page.items.filter((p) => !seen.has(p.coupon.id))];
        })();
  return { items, cursor: page.nextCursor, hasMore: page.nextCursor != null, error: false };
}
