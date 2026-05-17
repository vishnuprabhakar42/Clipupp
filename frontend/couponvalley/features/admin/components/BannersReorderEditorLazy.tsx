"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { BannersReorderEditor as Inner } from "./BannersReorderEditor";

/**
 * Client-only wrapper for the sortable banners editor. @dnd-kit assigns
 * non-deterministic accessibility IDs at mount time, so server-rendering it
 * causes the hydration mismatch warning. ssr:false sidesteps it.
 */
const InnerCmp = dynamic(
  () => import("./BannersReorderEditor").then((m) => m.BannersReorderEditor),
  {
    ssr: false,
    loading: () => <Skeleton />,
  }
);

function Skeleton() {
  return (
    <ul className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="h-[88px] animate-pulse rounded-md border bg-muted/40"
        />
      ))}
    </ul>
  );
}

export function BannersReorderEditor(props: ComponentProps<typeof Inner>) {
  return <InnerCmp {...props} />;
}
