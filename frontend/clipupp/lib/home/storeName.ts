/** Short store name for chips: drops a trailing " India" ("Amazon India" -> "Amazon"). */
export function displayShortName(name: string): string {
  const short = name.replace(/\s+India$/i, "").trim();
  return short || name;
}
