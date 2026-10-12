import { Link } from "@/lib/i18n/navigation";

/** Eyebrow + H2 left, optional full-scope link right. Reveals with the section. */
export function SectionHeader({ eyebrow, title, link, id }: { eyebrow?: string | null; title: string; id?: string; link?: { href: string; label: string } }) {
  return (
    <div className="clipupp-reveal mb-7 flex flex-col items-start justify-between gap-2 md:flex-row md:items-end md:gap-6">
      <div>
        {eyebrow && <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-clipupp-primary">{eyebrow}</span>}
        <h2 id={id} className="font-display text-[clamp(28px,3vw,32px)] font-semibold leading-[1.15] tracking-[-0.02em] text-clipupp-neutral-900">{title}</h2>
      </div>
      {link && (
        <Link href={link.href} className="whitespace-nowrap text-[15px] font-medium text-clipupp-primary hover:text-clipupp-primary-strong hover:underline">
          {link.label} →
        </Link>
      )}
    </div>
  );
}
