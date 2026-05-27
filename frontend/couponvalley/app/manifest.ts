import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CouponValley",
    short_name: "CouponValley",
    description: "Save more on every purchase with verified coupons, promo codes, and deals from your favourite stores.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3B82F6",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    categories: ["shopping", "lifestyle"],
    lang: "en",
    orientation: "portrait",
  };
}
