import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { NewStoreForm } from "@/features/admin/components/NewStoreForm";

export const metadata: Metadata = {
  title: "Admin · New store",
  robots: { index: false },
};

export default function NewStorePage() {
  return (
    <div>
      <AdminPageHeader
        back={{ label: "All stores", href: "/admin/stores" }}
        title="New store"
        description="Slug auto-derives from name when blank. logoUrl + primaryUrl + countryCode are required."
      />
      <div className="rounded-lg border bg-card p-6">
        <NewStoreForm />
      </div>
    </div>
  );
}
