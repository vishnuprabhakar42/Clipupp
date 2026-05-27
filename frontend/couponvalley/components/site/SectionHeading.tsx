import type { ReactNode } from "react";
import { Link } from "@/lib/i18n/navigation";

/**
 * Section heading used across the homepage and listing pages.
 * Standardises H2 typography (font-display 600), optional kicker label
 * above the title, and an optional "See all" link on the right.
 */
export function SectionHeading({
  kicker,
  title,
  description,
  seeAllHref,
  seeAllLabel = "See all",
  className,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  seeAllHref?: string;
  seeAllLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6 ${
        className ?? ""
      }`}
    >
      <div className="min-w-0">
        {kicker ? (
          <p className="cv-tag mb-2 bg-transparent px-0 text-cv-primary">
            {kicker}
          </p>
        ) : null}
        <h2 className="cv-h2">{title}</h2>
        {description ? (
          <p className="cv-body mt-2 max-w-prose text-cv-neutral-600">
            {description}
          </p>
        ) : null}
      </div>
      {seeAllHref ? (
        <Link
          href={seeAllHref}
          className="text-sm font-semibold text-cv-primary hover:underline"
        >
          {seeAllLabel} →
        </Link>
      ) : null}
    </div>
  );
}
