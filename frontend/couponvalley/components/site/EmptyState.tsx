import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

/**
 * Shared empty-state primitive. Server-render-safe. Used on /search
 * zero-results, account pages with nothing saved yet, blog filters
 * that return no results, etc.
 *
 * Three visual layers:
 *   - icon tile (soft brand-primary background)
 *   - title (h3, short headline)
 *   - description (1-2 sentence prose)
 *   - optional action(s) — pass via children (Link, Button, etc.)
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-cv-primary-soft">
        <Icon className="h-7 w-7 text-cv-primary" aria-hidden strokeWidth={1.75} />
      </span>
      <h3 className="cv-h3 mt-1">{title}</h3>
      {description && (
        <p className="cv-body max-w-sm text-cv-neutral-600">{description}</p>
      )}
      {children && <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  );
}
