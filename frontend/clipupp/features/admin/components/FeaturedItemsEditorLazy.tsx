"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { FeaturedItemsEditor as FeaturedItemsEditorType } from "./FeaturedItemsEditor";

/**
 * Client-only wrapper — see HomepageSectionsEditorLazy for rationale.
 * @dnd-kit's useSortable creates non-deterministic IDs across server/client,
 * triggering React hydration warnings.
 */
const Inner = dynamic(
  () => import("./FeaturedItemsEditor").then((m) => m.FeaturedItemsEditor),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 rounded-lg border bg-card">
          <div className="h-full w-full animate-pulse rounded-lg bg-muted/30" />
        </div>
        <div className="h-96 rounded-lg border bg-card">
          <div className="h-full w-full animate-pulse rounded-lg bg-muted/30" />
        </div>
      </div>
    ),
  }
);

export function FeaturedItemsEditor(
  props: ComponentProps<typeof FeaturedItemsEditorType>
) {
  return <Inner {...props} />;
}
