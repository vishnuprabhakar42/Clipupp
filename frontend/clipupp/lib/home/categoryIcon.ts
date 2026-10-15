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
  "dumbbell",
  "heart-pulse",
  "landmark",
  "book-open",
  "baby",
  "paw-print",
  "gem",
  "gift",
  "car",
  "gamepad-2",
  "briefcase",
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
  "heart-pulse": "heart-pulse",
  dumbbell: "dumbbell",
  landmark: "landmark",
  "book-open": "book-open",
  baby: "baby",
  "paw-print": "paw-print",
  gem: "gem",
  gift: "gift",
  car: "car",
  "gamepad-2": "gamepad-2",
  briefcase: "briefcase",
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

// Keyword fallback over the category slug and title, first match wins.
const KEYWORDS: [RegExp, CategoryIcon][] = [
  [/sport|fitness|gym|cycl|outdoor/, "dumbbell"],
  [/health|wellness|pharm|medic|diagnos/, "heart-pulse"],
  [/beauty|personal-care|personal care|makeup|skincare|haircare|fragrance|cosmetic/, "sparkles"],
  [/home|living|furniture|decor/, "sofa"],
  [/food|dining|restaurant|delivery/, "utensils"],
  [/travel|flight|hotel|cab|holiday/, "plane"],
  [/electronic|mobile|laptop|tablet|gadget|wearable|tv/, "smartphone"],
  [/fashion|cloth|apparel|footwear|wear/, "shirt"],
  [/grocer|supermarket/, "shopping-cart"],
  [/recharge|bill|utilit/, "zap"],
  [/entertain|ott|stream|movie|music/, "play"],
  [/financ|bank|insur|loan|card/, "landmark"],
  [/book|education|learn|course/, "book-open"],
  [/baby|kid|toy/, "baby"],
  [/pet/, "paw-print"],
  [/jewel|accessor/, "gem"],
  [/gift|flower|occasion/, "gift"],
  [/auto|car-|vehicle|bike/, "car"],
  [/gam/, "gamepad-2"],
  [/office|business|stationer/, "briefcase"],
  [/market|store|shop/, "store"],
];

/** Resolve an icon from the backend icon name, then keywords in the slug or title, then "tag". */
export function resolveCategoryIcon(icon: string | null | undefined, ...hints: (string | null | undefined)[]): CategoryIcon {
  const direct = categoryIcon(icon);
  if (direct !== "tag") return direct;
  const text = hints.filter(Boolean).join(" ").toLowerCase();
  for (const [re, name] of KEYWORDS) if (re.test(text)) return name;
  return "tag";
}
