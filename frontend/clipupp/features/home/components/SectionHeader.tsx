import type { ReactNode } from "react";
import { Link } from "@/lib/i18n/navigation";

/**
 * Eyebrow + H2 (+ optional muted sub line) left, optional full-scope link and
 * an `actions` slot right, bottom-aligned with the heading at every width. Reveals with the section.
 */
export function SectionHeader({
  eyebrow,
  title,
  sub,
  link,
  id,
  actions,
  eyebrowTone = "brand",
}: {
  eyebrow?: string | null;
  title: string;
  sub?: string;
  id?: string;
  link?: { href: string; label: string };
  actions?: ReactNode;
  eyebrowTone?: "brand" | "danger";
}) {
  return (
    <div className="clipupp-reveal mb-[22px] flex items-end justify-between gap-3 md:gap-6">
      <div className="min-w-0">
        {eyebrow && (
          <span
            className={`mb-1.5 block text-[11.5px] font-semibold uppercase leading-[1.5] tracking-[0.07em] ${eyebrowTone === "danger" ? "text-clipupp-danger" : "text-clipupp-primary"}`}
          >
            {eyebrow}
          </span>
        )}
        <h2 id={id} className="text-balance font-display text-[length:var(--fs-h2)] font-semibold leading-[1.15] tracking-[-0.01em] text-clipupp-neutral-900">{title}</h2>
        {sub && <p className="mt-1.5 text-[15px] text-clipupp-neutral-600">{sub}</p>}
      </div>
      {(link || actions) && (
        <div className="flex shrink-0 items-center gap-4">
          {link && (
            <Link href={link.href} className="whitespace-nowrap text-[15px] font-medium text-clipupp-primary hover:text-clipupp-primary-strong hover:underline">
              {link.label} →
            </Link>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
