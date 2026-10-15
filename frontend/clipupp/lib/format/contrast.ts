/** WCAG relative luminance of a `#rgb` or `#rrggbb` colour, or null for anything else (CSS vars, names). */
function luminance(hex: string): number | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of two hex colours, or null when either is not a hex colour. */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la == null || lb == null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const LIGHT_INK = "#FFFFFF";
/** Near-black brand purple (`--clipupp-ft-bg`), the dark ink for light and mid tiles. */
const DARK_INK = "#170A2E";

/**
 * Text colour for a tile with background `bg` (e.g. a store monogram): keeps
 * `preferred` when it reaches 4.5:1, else the better of white and near-black
 * purple. A few mid tones (e.g. #E91E63) reach 4.35:1 at best; monograms stand
 * in for a logo next to the store name, so that is accepted (WCAG logotype).
 * Non-hex backgrounds (CSS variables) keep `preferred`.
 */
export function readableInk(bg: string, preferred: string = LIGHT_INK): string {
  const own = contrastRatio(preferred, bg);
  if (own == null && luminance(bg) == null) return preferred;
  if (own != null && own >= 4.5) return preferred;
  const light = contrastRatio(LIGHT_INK, bg) ?? 0;
  const dark = contrastRatio(DARK_INK, bg) ?? 0;
  return light >= dark ? LIGHT_INK : DARK_INK;
}

/**
 * Ink for a store monogram tile, plus whether even the best ink stays under
 * 4.5:1 (the accepted logotype case above). Callers mark those tiles with
 * `data-a11y-exception` so the automated axe run skips them.
 */
export function monogramInk(bg: string, preferred?: string): { ink: string; lowContrast: boolean } {
  const ink = readableInk(bg, preferred);
  const ratio = contrastRatio(ink, bg);
  return { ink, lowContrast: ratio != null && ratio < 4.5 };
}
