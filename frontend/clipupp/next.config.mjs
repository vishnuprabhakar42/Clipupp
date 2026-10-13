import createNextIntlPlugin from "next-intl/plugin";
import nextBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

// Opt-in bundle visualizer. Run `npm run analyze` to produce static reports
// under .next/analyze and open them in a browser. Off by default — wraps to
// a no-op when ANALYZE is unset, so production builds are unaffected.
const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

// Where the proxy forwards to. BACKEND_URL is the single source of truth —
// NEXT_PUBLIC_API_BASE_URL is deliberately ignored here so browser fetches
// always go through the Next.js proxy (same-origin). See lib/api/client.ts.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// CSP starts in report-only — we are intentionally permissive while we
// observe what real traffic uses. Switch to enforcement mode (Content-Security-Policy
// header) in Phase 6 after ≥2 weeks of report-only telemetry. Google OAuth needs
// accounts.google.com on script/frame; R2 + Clearbit + Unsplash + Wikimedia on img.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self' https://accounts.google.com https://www.googleapis.com",
  "frame-src 'self' https://accounts.google.com",
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  // `upgrade-insecure-requests` is ignored in a report-only policy (browsers log
  // a console error for it); add it back when this switches to enforcement.
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  // Tree-shake large index-re-export packages. Cuts ~15–25KB off public route
  // bundles. lucide-react alone exports ~1000 icons by name; without this
  // every page that uses one icon imports the whole barrel.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "framer-motion",
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-tabs",
      "@radix-ui/react-select",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Store logos + editorial photos rarely change; new uploads get fresh R2 keys.
    // 1 year cache on /_next/image lets the CDN/browser keep them forever.
    minimumCacheTTL: 31_536_000,
    // Drop the default 16/32/48 thumbnail sizes — wasted bandwidth on a
    // catalog site where the smallest meaningful image is the 64px store logo.
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [64, 96, 128, 188, 256, 384],
    remotePatterns: [
      // Cloudflare R2 (admin uploads land here)
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      // Common merchant logo CDNs (will be tightened once we know our exact hosts)
      { protocol: "https", hostname: "**.cloudfront.net" },
      // Real brand logos for stores (seeded by the backend)
      { protocol: "https", hostname: "logo.clearbit.com" },
      // Marketplace product images (live deals)
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "rukminim2.flixcart.com" },
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
   *   - the clipupp_rt cookie is set on this origin (localhost:3000) and visible
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
  /**
   * Security headers. CSP is report-only for now — we'll enforce in Phase 6
   * after observing real traffic. The rest are safe to enforce immediately.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
          },
          { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
        ],
      },
      // Affiliate redirects must never be cached or framed.
      {
        source: "/r/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      // OG image routes are crawled but the underlying route shouldn't be indexed.
      {
        source: "/og/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
