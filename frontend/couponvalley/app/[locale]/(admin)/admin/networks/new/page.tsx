import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { NewNetworkForm } from "@/features/admin/components/NewNetworkForm";

export const metadata: Metadata = {
  title: "Admin · New network",
  robots: { index: false },
};

export default function NewNetworkPage() {
  return (
    <div>
      <AdminPageHeader
        back={{ label: "All networks", href: "/admin/networks" }}
        title="New affiliate network"
        description="The code must match a registered NetworkAdapter (impact, cj, awin, rakuten, admitad)."
      />
      <div className="rounded-lg border bg-card p-6">
        <NewNetworkForm />
      </div>
    </div>
  );
}
