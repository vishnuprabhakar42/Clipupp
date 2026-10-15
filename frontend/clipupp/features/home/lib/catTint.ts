/** Placeholder tints per category, used behind deal images (design `CATTINT`). */
export const CATTINT: Record<string, { bg: string; fg: string }> = {
  electronics: { bg: "#e8eefc", fg: "#1f3f9a" },
  home: { bg: "#fdf0e4", fg: "#a1500f" },
  fashion: { bg: "#fbe9f1", fg: "#a3245b" },
  grocery: { bg: "#e9f5e6", fg: "#2f6d1f" },
  beauty: { bg: "#f6e8fb", fg: "#7b2a96" },
};

export const DEFAULT_TINT = { bg: "#efeaf8", fg: "#5a3d99" };

/** Tint for a category slug; backend slugs such as "home-living" match by prefix. */
export function catTint(cat: string | null | undefined): { bg: string; fg: string } {
  if (!cat) return DEFAULT_TINT;
  const c = cat.toLowerCase();
  if (CATTINT[c]) return CATTINT[c];
  const key = Object.keys(CATTINT).find((k) => c.startsWith(k));
  return key ? CATTINT[key] : DEFAULT_TINT;
}
