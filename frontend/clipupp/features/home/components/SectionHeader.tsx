import type { ReactNode } from "react";
import { Link } from "@/lib/i18n/navigation";

/**
 * Eyebrow + H2 (+ optional muted sub line) left, optional full-scope link and
 * an `actions` slot right (below the heading on phone). Reveals with the section.
 */
export function SectionHeader({
  eyebrow,
  title,
  sub,
  link,
  id,
  actions,
}: {
  eyebrow?: string | null;
  title: string;
  sub?: string;
  id?: string;
  link?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <div className="clipupp-reveal mb-7 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end md:gap-6">
      <div>
        {eyebrow && <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-clipupp-primary">{eyebrow}</span>}
        <h2 id={id} className="font-display text-[clamp(28px,3vw,32px)] font-semibold leading-[1.15] tracking-[-0.02em] text-clipupp-neutral-900">{title}</h2>
        {sub && <p className="mt-1.5 text-[15px] text-clipupp-neutral-500">{sub}</p>}
      </div>
      {(link || actions) && (
        <div className="flex items-center gap-4">
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
