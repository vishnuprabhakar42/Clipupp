import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

/**
 * Shared error-state primitive. Used by route-group `error.tsx` boundaries
 * and inline async-fetch failures. Mirrors EmptyState's shape but with a
 * danger-toned illustration tile + a "Try again" affordance via children.
 *
 * Server-render-safe. The retry button passed as children is what gets
 * the `'use client'` boundary (typically a small client island that
 * exposes `reset()` from Next's error boundary).
 */
export function ErrorState({
  title = "Something went wrong",
  description,
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center"
    >
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-clipupp-danger-soft text-clipupp-danger-strong">
        <AlertCircle className="h-8 w-8" aria-hidden strokeWidth={2} />
      </span>
      <h3 className="clipupp-h3 mt-2">{title}</h3>
      {description && (
        <p className="clipupp-body max-w-sm text-clipupp-neutral-600">{description}</p>
      )}
      {children && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
