import Image from "next/image";

import { Link } from "@/lib/i18n/navigation";

/**
 * Clipupp brand assets.
 *
 * Source-of-truth artwork lives in /public - all variants are crops of the
 * same canonical design and stay pixel-aligned across variants:
 *
 *   logo.png               1151×334  icon + wordmark, transparent bg
 *                                    (default for light-bg headers)
 *   logo-on-dark.png       1151×334  same crop; "Clip" recolored white,
 *                                    "upp" + icon stay purple
 *                                    (footer + any dark-bg context)
 *   logo-full.png          1250×504  full design with tagline
 *                                    "CLIP MORE. SAVE MORE. EARN MORE."
 *                                    (hero splashes, OG share cards, email)
 *   logo-full-on-dark.png  1250×504  full design, dark-bg recolor
 *                                    (dark hero / share-card variant)
 *   logo-mark.png           332×332  icon-only square (favicon, compact spots)
 *   logo-mark-white.png     332×332  icon-only, full white recolor
 *                                    (drawer header on a dark gradient, etc.)
 *
 * Components:
 *   <LogoMark variant>      - icon only
 *   <LogoWordmark variant>  - icon + Clipupp wordmark (and optionally tagline)
 *   <Logo variant>          - clickable wordmark linking to "/"
 *
 * All variants render through next/image so they ship as AVIF/WebP with the
 * right srcset on retina screens.
 */

type WordmarkVariant = "default" | "on-dark" | "white" | "full" | "full-on-dark";
type MarkVariant = "mark" | "mark-white";

const VARIANT = {
  default: { src: "/logo.png", w: 1151, h: 525 },
  "on-dark": { src: "/logo-on-dark.png", w: 1151, h: 525 },
  white: { src: "/logo-white.png", w: 1151, h: 525 },
  full: { src: "/logo-full.png", w: 1250, h: 504 },
  "full-on-dark": { src: "/logo-full-on-dark.png", w: 1250, h: 504 },
  mark: { src: "/logo-mark.png", w: 455, h: 455 },
  "mark-white": { src: "/logo-mark-white.png", w: 455, h: 455 },
} as const;

export function LogoMark({
  variant = "mark",
  size = 40,
  priority = false,
  className,
}: {
  variant?: MarkVariant;
  size?: number;
  priority?: boolean;
  className?: string;
}) {
  const asset = VARIANT[variant];
  return (
    <Image
      src={asset.src}
      alt="Clipupp"
      width={size}
      height={size}
      sizes={`${size}px`}
      priority={priority}
      className={className}
    />
  );
}

export function LogoWordmark({
  variant = "default",
  height = 40,
  priority = false,
  className,
}: {
  variant?: WordmarkVariant;
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  const asset = VARIANT[variant];
  const aspect = asset.w / asset.h;
  const width = Math.round(height * aspect);
  return (
    <Image
      src={asset.src}
      alt="Clipupp"
      width={width}
      height={height}
      sizes={`${width}px`}
      priority={priority}
      className={className}
      // Both sides in px and equal to the attributes: an "auto" side renders a
      // fractional width, which next/image reports as a one-sided resize.
      style={{ height, width }}
    />
  );
}

/**
 * Full clickable header logo: wordmark wrapped in a Link to "/".
 * `height` sets the rendered pixel height; aspect-ratio is preserved.
 *
 * Pick `variant` to match the surrounding surface:
 *   "default"      - purple icon, dark "Clip", purple "upp" (light bg, default)
 *   "on-dark"      - purple icon, white "Clip", purple "upp" (dark bg accent)
 *   "white"        - entire wordmark recoloured pure white (high-contrast
 *                    footers / pure-monochrome use)
 *   "full"         - adds the tagline below the wordmark
 *   "full-on-dark" - tagline variant for dark backgrounds
 */
export function Logo({
  href = "/",
  variant = "default",
  height = 40,
  priority = true,
  className,
  imgClassName,
}: {
  href?: string;
  variant?: WordmarkVariant;
  height?: number;
  priority?: boolean;
  className?: string;
  /** Classes for the <img>; override the inline size responsively with both `!h-[..]` and `!w-[..]` (keep the aspect). */
  imgClassName?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Clipupp home"
      className={`inline-flex shrink-0 items-center ${className ?? ""}`}
    >
      <LogoWordmark variant={variant} height={height} priority={priority} className={imgClassName} />
    </Link>
  );
}
