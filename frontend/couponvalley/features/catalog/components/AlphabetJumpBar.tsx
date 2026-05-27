/**
 * A-Z anchor strip for the stores list. Server-rendered: each letter is a
 * plain `<a href="#letter-X">` so it works without JS (browser native
 * anchor scroll + `scroll-mt-24` on the target sections handles the
 * sticky-header offset). Letters not present in the catalog render as
 * disabled chips so the grid stays consistent.
 *
 * SEO bonus: even without JS, the anchor links + the scroll-mt-24 on each
 * letter group create discoverable in-page sections crawlers can land on
 * via fragment URLs (#letter-a, #letter-b, etc.).
 */
export function AlphabetJumpBar({
  availableLetters,
}: {
  /** Uppercase A-Z letters that have at least one store. Used to dim the
   *  chips for letters with zero matches (and skip the # bucket if empty). */
  availableLetters: string[];
}) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const present = new Set(availableLetters.map((l) => l.toUpperCase()));
  const hasNumeric = availableLetters.includes("#");
  return (
    <nav
      aria-label="Jump to letter"
      className="mb-6 flex flex-wrap items-center gap-1.5 rounded-lg border border-cv-neutral-200 bg-white p-2 shadow-card"
    >
      <span className="cv-meta px-2 uppercase tracking-[0.04em]">A–Z</span>
      {letters.map((L) => {
        const enabled = present.has(L);
        return enabled ? (
          <a
            key={L}
            href={`#letter-${L}`}
            className="grid h-8 w-8 place-items-center rounded text-xs font-semibold text-cv-neutral-700 transition-colors hover:bg-cv-primary-soft hover:text-cv-primary"
          >
            {L}
          </a>
        ) : (
          <span
            key={L}
            className="grid h-8 w-8 cursor-not-allowed place-items-center rounded text-xs font-semibold text-cv-neutral-300"
            aria-disabled="true"
          >
            {L}
          </span>
        );
      })}
      {hasNumeric && (
        <a
          href="#letter-num"
          className="grid h-8 min-w-[28px] place-items-center rounded px-2 text-xs font-semibold text-cv-neutral-700 transition-colors hover:bg-cv-primary-soft hover:text-cv-primary"
        >
          0–9
        </a>
      )}
    </nav>
  );
}
