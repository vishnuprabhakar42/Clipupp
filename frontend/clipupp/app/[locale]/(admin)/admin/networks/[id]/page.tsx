import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminFetch } from "@/lib/admin/server-fetch";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { NetworkForm } from "@/features/admin/components/NewNetworkForm";
import type { AdminNetworkRow } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Admin · Edit network",
  robots: { index: false },
};

type Params = Promise<{ id: string; locale: string }>;

export default async function EditNetworkPage({ params }: { params: Params }) {
  const { id } = await params;
  const network = await adminFetch<AdminNetworkRow>(`/api/v1/admin/affiliate-networks/${id}`);
  if (!network) notFound();

  return (
    <div>
      <AdminPageHeader
        back={{ label: "All networks", href: "/admin/networks" }}
        title={`Edit: ${network.name}`}
        description={
          <span>
            Code <code className="rounded bg-muted px-1 font-mono text-xs">{network.code}</code>
            {" · "}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                network.active
                  ? "bg-clipupp-success-soft text-clipupp-success-strong"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {network.active ? "Active" : "Inactive"}
            </span>
          </span>
        }
      />
      <div className="rounded-lg border bg-card p-6">
        <NetworkForm mode="edit" initial={network} />
      </div>
    </div>
  );
}
