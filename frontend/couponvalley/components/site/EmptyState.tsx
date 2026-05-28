import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

/**
 * Shared empty-state primitive. Server-render-safe. Used on /search
 * zero-results, account pages with nothing saved yet, blog filters
 * that return no results, etc.
 *
 * Visual: gradient illustration tile (crimson → amber) + Manrope title
 * + Inter body + optional CTA(s) via children.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  children,
  tone = "primary",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  tone?: "primary" | "accent" | "success";
}) {
  const tileClass =
    tone === "accent"
      ? "cv-gradient-warm"
      : tone === "success"
        ? "cv-gradient-success"
        : "cv-gradient-cool";

  return (
    <div
      role="status"
      className="mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center"
    >
      <span
        className={`grid h-16 w-16 place-items-center rounded-2xl ${tileClass}`}
        style={{ boxShadow: "var(--cv-shadow-lifted)" }}
      >
        <Icon className="h-8 w-8 text-white" aria-hidden strokeWidth={2} />
      </span>
      <h3 className="cv-h3 mt-2">{title}</h3>
      {description && (
        <p className="cv-body max-w-sm text-cv-neutral-600">{description}</p>
      )}
      {children && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
