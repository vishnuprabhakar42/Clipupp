import type { Metadata } from "next";
import { localeToBcp47, locales, type Locale } from "@/lib/i18n/config";
import { canonicalFor, hreflangAlternates, siteUrl } from "./urls";

export type BuildMetadataOptions = {
  /** Page title — passed through as-is. Title template from root layout
   *  ("%s — Clipupp") applies unless `titleAbsolute: true` is set. */
  title: string;
  /** Meta description (≤160 chars ideally). */
  description: string;
  /** Canonical path WITHOUT locale prefix (e.g. "/stores", "/stores/amazon"). */
  path: string;
  /** Current locale; used for canonical URL + og:locale + alternate locales. */
  locale: Locale;
  /** OG image — absolute URL or site-relative path (e.g. "/og/store/amazon"). */
  image?: string;
  /** og:type — Next 15 limits this to a fixed set; "website" (default) is
   *  used for everything except blog posts ("article"). Coupon-detail pages
   *  use "website" + a Product JSON-LD schema (which is what Google indexes
   *  for product rich results anyway). */
  ogType?: "website" | "article";
  /** Use the absolute title (skip the root layout's "%s — Clipupp" template). */
  titleAbsolute?: boolean;
  /** Set true to mark the page noindex,nofollow (search results, account pages). */
  noindex?: boolean;
  /** When true with noindex, still keeps `follow` (auth pages — let crawlers
   *  walk outbound links even though the auth page itself isn't indexed). */
  followWhenNoindex?: boolean;
};

/**
 * Centralised metadata builder. Every page's `generateMetadata` should call
 * this so canonical / hreflang / OG / Twitter / robots are wired consistently
 * and adding a new locale only requires updating `lib/i18n/config.ts`.
 *
 * What it produces:
 *  - title (absolute or templated)
 *  - description
 *  - alternates.canonical (locale-aware via canonicalFor)
 *  - alternates.languages (every locale + x-default via hreflangAlternates)
 *  - openGraph.{type, title, description, url, siteName, locale,
 *               alternateLocale, images}
 *  - twitter.{card, title, description, images}
 *  - robots (only when noindex requested — the root layout's
 *           {index:true, follow:true} default applies otherwise)
 */
export function buildMetadata(opts: BuildMetadataOptions): Metadata {
  const canonical = canonicalFor(opts.path, opts.locale);
  const image = opts.image
    ? opts.image.startsWith("http")
      ? opts.image
      : `${siteUrl()}${opts.image.startsWith("/") ? opts.image : `/${opts.image}`}`
    : undefined;

  const alternateLocale = locales
    .filter((l) => l !== opts.locale)
    .map((l) => localeToBcp47[l]);

  const meta: Metadata = {
    title: opts.titleAbsolute ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: {
      canonical,
      languages: hreflangAlternates(opts.path),
    },
    openGraph: {
      type: opts.ogType ?? "website",
      title: opts.title,
      description: opts.description,
      url: canonical,
      siteName: "Clipupp",
      locale: localeToBcp47[opts.locale],
      ...(alternateLocale.length > 0 && { alternateLocale }),
      ...(image && {
        images: [
          { url: image, width: 1200, height: 630, alt: opts.title },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      ...(image && { images: [image] }),
    },
  };

  if (opts.noindex) {
    meta.robots = { index: false, follow: opts.followWhenNoindex ?? false };
  }

  return meta;
}
