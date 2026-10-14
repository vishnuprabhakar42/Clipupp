"use client";

import Image from "next/image";
import { useState } from "react";
import { blurDataUrl } from "@/lib/img/blur";

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

/**
 * Product image that removes itself (and its .clipupp-deal-img tile) when it
 * fails to load, leaving the tinted placeholder.
 */
export function DealImage({ src, sizes, tintBg }: { src: string; sizes: string; /** Category tint hex painted while the image loads. */ tintBg: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <span className="clipupp-deal-img">
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        placeholder="blur"
        blurDataURL={blurDataUrl(tintBg)}
        unoptimized={!optimizable(src)}
        onError={() => setFailed(true)}
        className="object-contain p-3"
      />
    </span>
  );
}
