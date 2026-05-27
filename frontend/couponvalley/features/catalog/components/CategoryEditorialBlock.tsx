/**
 * Long-form category description rendered as a constrained prose column.
 * Only meaningful when there's substantial copy — the category-hero band
 * already shows short descriptions, so this block shows ONLY if the
 * description is longer than the short-cutoff (default 240 chars).
 *
 * Wrapped in a max-680px `.cv-prose` container so line length stays in
 * the readable range regardless of viewport.
 */
export function CategoryEditorialBlock({
  categoryTitle,
  description,
  minLength = 240,
}: {
  categoryTitle: string;
  description: string | null | undefined;
  minLength?: number;
}) {
  if (!description) return null;
  const trimmed = description.trim();
  if (trimmed.length < minLength) return null;
  return (
    <section
      aria-labelledby="category-editorial-heading"
      className="cv-section border-t border-cv-neutral-200"
    >
      <div className="cv-prose">
        <h2 id="category-editorial-heading" className="cv-h2">
          More about {categoryTitle} deals
        </h2>
        <div className="mt-4 space-y-4 text-[0.9375rem] leading-[1.7] text-cv-neutral-700">
          {trimmed.split(/\n\n+/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
