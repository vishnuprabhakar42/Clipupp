"use client";

import dynamic from "next/dynamic";

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
  return (
    <>
      <CookieBanner />
      <FirstVisitModal />
      <WebVitalsReporter />
    </>
  );
}
