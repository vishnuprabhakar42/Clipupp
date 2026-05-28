"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { HomepageSectionsEditor as HomepageSectionsEditorType } from "./HomepageSectionsEditor";

/**
 * Client-only wrapper. @dnd-kit's useSortable generates internal IDs
 * (DndDescribedBy-N) from a global counter that resets each render — so the
 * server-rendered HTML never agrees with what the browser produces on
 * hydration, throwing the "tree hydrated but some attributes... didn't match"
 * warning. ssr:false sidesteps the issue cleanly; the editor is admin-only
 * so SEO doesn't care, and a skeleton fills the gap until mount.
 */
const Inner = dynamic(
  () => import("./HomepageSectionsEditor").then((m) => m.HomepageSectionsEditor),
  {
    ssr: false,
    loading: () => <Skeleton />,
  }
);

function Skeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <li key={i} className="h-32 rounded-lg border bg-card">
          <div className="h-full w-full animate-pulse rounded-lg bg-muted/30" />
        </li>
      ))}
    </ul>
  );
}

export function HomepageSectionsEditor(
  props: ComponentProps<typeof HomepageSectionsEditorType>
) {
  return <Inner {...props} />;
}
