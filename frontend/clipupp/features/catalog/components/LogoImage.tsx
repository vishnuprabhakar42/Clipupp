"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";

/**
 * Logo image that swaps to `fallback` (a monogram tile from the server) when
 * the file fails to load, so a 404 logo never shows a broken image icon.
 */
export function LogoImage({
  src,
  width,
  height,
  sizes,
  className,
  frameClassName,
  frameStyle,
  fallback,
}: {
  src: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
  /** Classes of the frame around the image; the fallback replaces the whole frame. */
  frameClassName?: string;
  frameStyle?: CSSProperties;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    <span className={frameClassName} style={frameStyle}>
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        sizes={sizes}
        className={className}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
