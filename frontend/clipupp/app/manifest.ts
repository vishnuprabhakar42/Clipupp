import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clipupp",
    short_name: "Clipupp",
    description: "Save more on every purchase with verified coupons, promo codes, and deals from your favourite stores.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    // Matches --clipupp-primary-700 in globals.css (brand purple).
    theme_color: "#6D28D9",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
    categories: ["shopping", "lifestyle"],
    lang: "en",
    orientation: "portrait",
  };
}
