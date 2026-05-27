import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

// Where the proxy forwards to. BACKEND_URL is the single source of truth —
// NEXT_PUBLIC_API_BASE_URL is deliberately ignored here so browser fetches
// always go through the Next.js proxy (same-origin). See lib/api/client.ts.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Cloudflare R2 (admin uploads land here)
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      // Common merchant logo CDNs (will be tightened once we know our exact hosts)
      { protocol: "https", hostname: "**.cloudfront.net" },
      // Real brand logos for stores (seeded by the backend)
      { protocol: "https", hostname: "logo.clearbit.com" },
      // Free editorial / banner photography
      { protocol: "https", hostname: "images.unsplash.com" },
      // Author / generic avatars
      { protocol: "https", hostname: "api.dicebear.com" },
      // Common host for Wikimedia-served brand assets (some seeds use it)
      { protocol: "https", hostname: "upload.wikimedia.org" },
      // Placeholder image generator — V027 seed reverted store logos to
      // placehold.co tiles after Clearbit/Unsplash URLs proved unreliable.
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  /**
   * Same-origin proxy to the Spring backend. Required so that:
   *   - the cv_rt cookie is set on this origin (localhost:3000) and visible
   *     to server components via cookies()
   *   - the cookie travels on page navigations (Path=/ + same-origin)
   *   - browser-side fetches use credentials without CORS preflight noise
   *
   * Server-side fetches (getServerSession, adminFetch, getPublicSettings,
   * etc.) call BACKEND_URL directly so they don't double-hop through the
   * Next.js process. Browser-side calls go through the rewrite.
   */
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${BACKEND_URL}/api/v1/:path*` },
      { source: "/r/:path*", destination: `${BACKEND_URL}/r/:path*` },
      { source: "/postback/:path*", destination: `${BACKEND_URL}/postback/:path*` },
      { source: "/v3/api-docs/:path*", destination: `${BACKEND_URL}/v3/api-docs/:path*` },
      { source: "/swagger-ui/:path*", destination: `${BACKEND_URL}/swagger-ui/:path*` },
      { source: "/swagger-ui.html", destination: `${BACKEND_URL}/swagger-ui.html` },
      { source: "/actuator/:path*", destination: `${BACKEND_URL}/actuator/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);
