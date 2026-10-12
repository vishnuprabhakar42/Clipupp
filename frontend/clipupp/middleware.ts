import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

// Sprint 3: locale routing only.
// Sprint 1's auth gate runs server-side in (authed)/account/layout via getServerSession,
// so the middleware does not need to authenticate. The matcher excludes
// /api, _next, /og, /sitemap.xml, /sitemaps, /robots.txt, files with extensions,
// and the backend-proxied paths (/r/, /postback/, /v3/api-docs, /swagger-ui,
// /actuator). Without that, next-intl rewrote /r/{id} to /en/r/{id} before
// the next.config rewrite could proxy it, and every click-out 404ed.
export default createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemaps|og|r/|postback/|v3/api-docs|swagger-ui|actuator|.*\\..*).*)",
  ],
};
