import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Standard header for admin pages. Three props:
 *  • `title` — required, rendered as <h1>.
 *  • `description` — optional secondary copy / metadata strip.
 *  • `back` — optional { label, href } for a Back arrow above the title.
 *    Use on edit/detail pages so the user doesn't depend on the browser
 *    back stack.
 *  • `actions` — right-aligned button slot (typically a New / Save CTA).
 */
export function AdminPageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: ReactNode;
  back?: { label: string; href: string };
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 space-y-3">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-clipupp-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Branded primary CTA — switched to the purple brand color. */
export function AdminPrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md bg-clipupp-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-clipupp-primary-strong hover:shadow-md"
    >
      {children}
    </Link>
  );
}
