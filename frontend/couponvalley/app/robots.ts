import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/account/",
          "/api/",
          "/r/",
          "/og/",
          "/search",
          "/verify-email",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${API_BASE}/sitemap.xml`,
    host: SITE_URL,
  };
}
