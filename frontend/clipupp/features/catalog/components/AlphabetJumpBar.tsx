/**
 * A-Z anchor strip for the stores list. Server-rendered: each letter is a
 * plain `<a href="#letter-X">` so it works without JS (browser native
 * anchor scroll + `scroll-mt-24` on the target sections handles the
 * sticky-header offset). Letters not present in the catalog render as
 * disabled chips so the grid stays consistent.
 *
 * Visual tier (Phase 2): each enabled letter is a soft-pill chip; on hover
 * it becomes a crimson gradient pill with shadow-glow-primary. Disabled
 * letters stay flat neutral.
 *
 * SEO bonus: even without JS, the anchor links + the scroll-mt-24 on each
 * letter group create discoverable in-page sections crawlers can land on
 * via fragment URLs (#letter-a, #letter-b, etc.).
 */
export function AlphabetJumpBar({
  availableLetters,
}: {
  /** Uppercase A-Z letters that have at least one store. */
  availableLetters: string[];
}) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const present = new Set(availableLetters.map((l) => l.toUpperCase()));
  const hasNumeric = availableLetters.includes("#");
  return (
    <nav
      aria-label="Jump to letter"
      className="clipupp-card mb-6 flex flex-wrap items-center gap-1.5 p-2.5"
    >
      <span className="font-display px-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-clipupp-primary-700">
        A–Z
      </span>
      {letters.map((L) => {
        const enabled = present.has(L);
        return enabled ? (
          <a
            key={L}
            href={`#letter-${L}`}
            className="grid h-9 w-9 place-items-center rounded-md font-display text-[13px] font-extrabold text-clipupp-neutral-700 transition-all hover:scale-105 hover:bg-clipupp-primary-soft hover:text-clipupp-primary-700"
          >
            {L}
          </a>
        ) : (
          <span
            key={L}
            className="grid h-9 w-9 cursor-not-allowed place-items-center rounded-md font-display text-[13px] font-extrabold text-clipupp-neutral-300"
            aria-disabled="true"
          >
            {L}
          </span>
        );
      })}
      {hasNumeric && (
        <a
          href="#letter-num"
          className="grid h-9 min-w-[36px] place-items-center rounded-md px-2 font-display text-[13px] font-extrabold text-clipupp-neutral-700 transition-all hover:scale-105 hover:bg-clipupp-primary-soft hover:text-clipupp-primary-700"
        >
          0–9
        </a>
      )}
    </nav>
  );
}
