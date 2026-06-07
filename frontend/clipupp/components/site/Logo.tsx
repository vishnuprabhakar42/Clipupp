import Image from "next/image";

import { Link } from "@/lib/i18n/navigation";

/**
 * Clipupp brand assets.
 *
 * Source-of-truth artwork lives in /public:
 *   - logo.png       (1151×318) — icon + "Clipupp" wordmark, transparent bg
 *   - logo-mark.png  (332×332)  — icon-only square, transparent bg
 *   - logo-full.png  (1250×504) — full design with "CLIP MORE. SAVE MORE." tagline
 *
 * <LogoMark> — icon only. Use in compact slots (mobile drawer header,
 *              OG-image overlay, avatar tiles).
 * <Logo>     — clickable wordmark for the site header.
 *
 * All variants render through next/image so they ship as AVIF/WebP with the
 * right srcset on retina screens.
 */

const WORDMARK_ASPECT = 1151 / 318; // ≈ 3.62

export function LogoMark({
  size = 40,
  priority = false,
  className,
}: {
  size?: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src="/logo-mark.png"
      alt="Clipupp"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}

export function LogoWordmark({
  height = 40,
  priority = false,
  className,
}: {
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  const width = Math.round(height * WORDMARK_ASPECT);
  return (
    <Image
      src="/logo.png"
      alt="Clipupp"
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}

/**
 * Full clickable header logo: wordmark wrapped in a Link to "/".
 * `height` controls the rendered height in px; aspect-ratio is preserved.
 */
export function Logo({
  href = "/",
  height = 40,
  priority = true,
  className,
}: {
  href?: string;
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Clipupp home"
      className={`inline-flex shrink-0 items-center ${className ?? ""}`}
    >
      <LogoWordmark height={height} priority={priority} />
    </Link>
  );
}
