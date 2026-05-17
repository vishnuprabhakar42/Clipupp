import type { Metadata } from "next";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { HomepageSection } from "@/lib/api/homepage";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { HomepageSectionsEditor } from "@/features/admin/components/HomepageSectionsEditorLazy";

export const metadata: Metadata = {
  title: "Admin · Homepage",
  robots: { index: false },
};

export default async function HomepageAdmin() {
  const sections =
    (await adminFetch<HomepageSection[]>("/api/v1/admin/homepage/sections")) ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Homepage layout"
        description="Drag sections to reorder, edit titles, set per-section item limits, pin featured items, and toggle each section on or off. Changes go live within the 5-minute cache TTL — or instantly on save."
      />
      {sections.length === 0 ? (
        <div className="rounded-md border-2 border-dashed bg-white p-10 text-center">
          <h2 className="text-base font-semibold text-gray-900">No sections configured</h2>
          <p className="mt-1 text-sm text-cv-neutral-500">
            The V015 migration seeds the seven default sections — make sure it ran on startup.
          </p>
        </div>
      ) : (
        <HomepageSectionsEditor initial={sections} />
      )}
    </div>
  );
}
