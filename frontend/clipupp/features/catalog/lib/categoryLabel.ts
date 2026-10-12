/** "live-events" -> "Live events": every word of the slug, sentence case. */
export function categoryLabel(slug: string): string {
  const words = slug.split("-").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
