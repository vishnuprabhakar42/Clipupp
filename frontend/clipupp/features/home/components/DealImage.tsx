"use client";

import Image from "next/image";
import { useState } from "react";

const OPTIMIZED = [/\.r2\.dev$/, /\.r2\.cloudflarestorage\.com$/, /\.cloudfront\.net$/, /^logo\.clearbit\.com$/, /^images\.unsplash\.com$/, /^api\.dicebear\.com$/, /^upload\.wikimedia\.org$/, /^placehold\.co$/, /^m\.media-amazon\.com$/, /^rukminim2\.flixcart\.com$/];

function optimizable(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    return OPTIMIZED.some((re) => re.test(host));
  } catch {
    return false;
  }
}

/** Product image that removes itself when it fails to load, leaving the tinted placeholder. */
export function DealImage({ src, sizes }: { src: string; sizes: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      unoptimized={!optimizable(src)}
      onError={() => setFailed(true)}
      className="object-contain p-3"
    />
  );
}
