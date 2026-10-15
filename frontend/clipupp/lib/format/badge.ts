export type BadgeInput = {
  savingsLabel: string | null | undefined;
  title: string;
  code: string | null | undefined;
};

/**
 * Short discount chip for a coupon: the first percentage found in the
 * savings label then the title ("12%"), else the first rupee amount
 * ("₹500"), else the generic "Deal". `code` is accepted for call-site
 * symmetry with the card props but does not affect the result.
 */
export function badgeFor({ savingsLabel, title }: BadgeInput): string {
  const sources = [savingsLabel, title].filter((s): s is string => !!s);
  for (const text of sources) {
    const pct = text.match(/\d+%/);
    if (pct) return pct[0];
  }
  for (const text of sources) {
    const rupee = text.match(/₹\s?\d[\d,]*/);
    if (rupee) return rupee[0].replace(/\s/g, "");
  }
  return "Deal";
}
