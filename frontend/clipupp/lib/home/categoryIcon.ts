/** Lucide icon names the homepage category rail can render. */
export const CATEGORY_ICONS = [
  "shirt",
  "smartphone",
  "utensils",
  "plane",
  "shopping-cart",
  "sparkles",
  "zap",
  "pill",
  "play",
  "sofa",
  "store",
  "flame",
  "tag",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

// Backend icon names (and the design's sprite ids) mapped onto the set above.
const ALIASES: Record<string, CategoryIcon> = {
  shirt: "shirt",
  smartphone: "smartphone",
  phone: "smartphone",
  cpu: "smartphone",
  utensils: "utensils",
  food: "utensils",
  plane: "plane",
  "shopping-cart": "shopping-cart",
  cart: "shopping-cart",
  sparkles: "sparkles",
  sparkle: "sparkles",
  zap: "zap",
  bolt: "zap",
  pill: "pill",
  "heart-pulse": "pill",
  play: "play",
  sofa: "sofa",
  home: "sofa",
  store: "store",
  flame: "flame",
  diya: "flame",
};

/** Map a backend (or design) icon name to a supported lucide name, default "tag". */
export function categoryIcon(name: string | null | undefined): CategoryIcon {
  if (!name) return "tag";
  return ALIASES[name.trim().toLowerCase()] ?? "tag";
}
