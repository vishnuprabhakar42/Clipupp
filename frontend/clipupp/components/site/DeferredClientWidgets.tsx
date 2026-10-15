"use client";

import dynamic from "next/dynamic";
import { usePathname } from "@/lib/i18n/navigation";

// CookieBanner, FirstVisitModal, and WebVitalsReporter are all client-only
// widgets that don't need to render in the SSR HTML — they hydrate after the
// page is interactive. Lazy-loading them through next/dynamic with ssr:false
// keeps the initial JS bundle smaller. Wrapping in this tiny "use client"
// component is required because Next 15 forbids `ssr: false` inside server
// components.
const CookieBanner = dynamic(
  () => import("@/components/site/CookieBanner").then((m) => m.CookieBanner),
  { ssr: false, loading: () => null }
);
const FirstVisitModal = dynamic(
  () => import("@/components/site/FirstVisitModal").then((m) => m.FirstVisitModal),
  { ssr: false, loading: () => null }
);
const WebVitalsReporter = dynamic(
  () => import("@/components/site/WebVitalsReporter").then((m) => m.WebVitalsReporter),
  { ssr: false, loading: () => null }
);

export function DeferredClientWidgets() {
  // No newsletter interstitial on the homepage: the hero is the landing
  // experience, and a modal over it is a mobile intrusive-interstitial
  // signal. usePathname here is locale-relative, so "/" also covers "/hi".
  const pathname = usePathname();
  const isHome = pathname === "/";
  return (
    <>
      <CookieBanner />
      {!isHome && <FirstVisitModal />}
      <WebVitalsReporter />
    </>
  );
}
