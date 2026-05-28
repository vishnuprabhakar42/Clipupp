import { Link } from "@/lib/i18n/navigation";

/**
 * ClipUpp logo — paperclip mark + "clipupp" wordmark.
 *
 * - `<LogoMark />`: icon-only paperclip on a rounded-square gradient tile.
 *   Use as the avatar in tight navbar spots, mobile drawer header,
 *   apple-touch-icon source, and OG image overlay.
 * - `<LogoWordmark />`: full inline-SVG wordmark with paperclip on the left,
 *   "clipupp" lowercase on the right. Uses `currentColor` for the strokes
 *   and fills so it adapts to any context (white on dark gradient, dark on
 *   light surfaces).
 * - `<Logo />`: convenience wrapper that links to `/` and renders the
 *   wordmark with a tinted brand-tile + gradient text wordmark. Used in
 *   the site header.
 *
 * Path notes:
 *   The paperclip is a single stroke: outer "U" (left vertical, bottom
 *   semicircle, right vertical) + a top semicircle that wraps over to a
 *   shorter inner stub. `stroke="currentColor" fill="none"` keeps the
 *   shape light + ink-tinted.
 */

const PAPERCLIP_D =
  "M11 6 L11 22 A4.5 4.5 0 0 0 20 22 L20 10 A3.5 3.5 0 0 0 13 10 L13 19";
const PAPERCLIP_VIEWBOX = "0 0 32 32";

export function LogoMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`grid place-items-center rounded-md text-white ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(135deg, var(--cv-primary-700), var(--cv-primary-500))",
        boxShadow: "var(--cv-shadow-glow-primary)",
      }}
      aria-hidden
    >
      <svg
        viewBox={PAPERCLIP_VIEWBOX}
        width={Math.round(size * 0.65)}
        height={Math.round(size * 0.65)}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d={PAPERCLIP_D}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * Wordmark-only SVG. Uses currentColor so the same component renders
 * correctly on any background. Width auto-scales when `height` is set
 * and `width` is omitted by the consumer.
 */
export function LogoWordmark({
  height = 32,
  className,
  monochrome = false,
}: {
  height?: number;
  className?: string;
  /** When true, the wordmark uses currentColor (e.g. white over hero
   *  gradients). When false (default), the wordmark uses the crimson
   *  gradient + the mark sits on a gradient tile. */
  monochrome?: boolean;
}) {
  const width = Math.round((height * 220) / 56);
  return (
    <svg
      viewBox="0 0 220 56"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ClipUpp"
      className={className}
    >
      {/* Paperclip mark — re-anchored into the 220×56 viewBox.
          Path uses the same shape as PAPERCLIP_D but scaled+positioned
          for the wordmark canvas (paperclip occupies x=14-32, y=10-42). */}
      <path
        d="M14 10 L14 42 A8 8 0 0 0 32 42 L32 18 A6 6 0 0 0 19 18 L19 36"
        fill="none"
        stroke={monochrome ? "currentColor" : "var(--cv-primary-600)"}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wordmark — Manrope. Using `<text>` keeps the SVG small and the
          font swap free at runtime. */}
      <text
        x={52}
        y={40}
        fontFamily="var(--font-display, 'Manrope'), 'Manrope', 'Inter', system-ui, sans-serif"
        fontWeight={800}
        fontSize={32}
        letterSpacing="-0.02em"
        fill={monochrome ? "currentColor" : "var(--cv-neutral-900)"}
      >
        clipupp
      </text>
    </svg>
  );
}

/**
 * Full clickable logo for the site header. Tile mark + gradient wordmark,
 * sized for the 56-64px header row.
 */
export function Logo({
  href = "/",
  showWordmark = true,
  monochrome = false,
}: {
  href?: string;
  showWordmark?: boolean;
  monochrome?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="ClipUpp home"
      className="inline-flex shrink-0 items-center gap-2.5"
    >
      <LogoMark size={36} />
      {showWordmark && (
        <span
          className={`hidden font-display text-[1.25rem] font-extrabold tracking-tight sm:inline-block ${
            monochrome ? "text-current" : "cv-text-gradient-hero"
          }`}
          style={{ letterSpacing: "-0.02em" }}
        >
          clipupp
        </span>
      )}
    </Link>
  );
}
