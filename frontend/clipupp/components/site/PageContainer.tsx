import type { ElementType, ReactNode } from "react";

/**
 * Standard page container — caps width at 1280px, applies responsive padding
 * (24/40/80) and section rhythm (48/80px). Composes `.clipupp-container` and
 * `.clipupp-section` so we have a single source of truth.
 *
 * `as` lets callers render this as a <section>, <main>, <article>, etc.
 * `bare` opts out of section vertical padding for hero-style sections that
 * supply their own.
 */
export function PageContainer({
  as: Tag = "section",
  bare = false,
  className,
  children,
}: {
  as?: ElementType;
  bare?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`${bare ? "" : "clipupp-section"} ${className ?? ""}`}>
      <div className="clipupp-container">{children}</div>
    </Tag>
  );
}
