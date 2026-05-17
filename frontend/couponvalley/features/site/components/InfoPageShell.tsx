import type { ReactNode } from "react";

/**
 * Consistent shell for static info / legal pages so they look intentional
 * even before final copy lands. Anchored ToC support comes free since each
 * caller can render <h2 id="…"> inside.
 */
export function InfoPageShell({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="container max-w-3xl py-10 md:py-14">
      <header className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {intro && <p className="mt-3 text-muted-foreground">{intro}</p>}
        {updated && (
          <p className="mt-2 text-xs text-muted-foreground">Last updated {updated}</p>
        )}
      </header>
      <article className="prose prose-slate max-w-none dark:prose-invert">
        {children}
      </article>
    </div>
  );
}
