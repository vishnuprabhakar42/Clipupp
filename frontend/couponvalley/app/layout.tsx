import type { ReactNode } from "react";

// The real root layout (html/body/providers) lives in app/[locale]/layout.tsx,
// where next-intl can read the active locale via {params}. This file is a
// passthrough so Next.js still has a top-level RootLayout.
//
// next-intl docs reference: https://next-intl.dev/docs/getting-started/app-router
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
