import type { Metadata } from "next";
import Link from "next/link";
import { Network as NetworkIcon } from "lucide-react";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { AdminNetworkRow } from "@/lib/api/admin";
import { AdminPageHeader, AdminPrimaryLink } from "@/features/admin/components/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin · Affiliate networks",
  robots: { index: false },
};

export default async function AdminNetworksPage() {
  const networks = (await adminFetch<AdminNetworkRow[]>("/api/v1/admin/affiliate-networks")) ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Affiliate networks"
        description="Networks we receive postbacks from. Each must have a registered NetworkAdapter on the backend."
        actions={<AdminPrimaryLink href="/admin/networks/new">New network</AdminPrimaryLink>}
      />

      {networks.length === 0 ? (
        <div className="rounded-md border-2 border-dashed bg-white p-12 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-cv-primary-soft text-cv-primary">
            <NetworkIcon className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">No networks yet</h2>
          <p className="mt-1 text-sm text-cv-neutral-500">
            Register an adapter on the backend, then create the row here.
          </p>
          <AdminPrimaryLink href="/admin/networks/new">Create first network</AdminPrimaryLink>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Code</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Secret</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {networks.map((n) => (
                <tr key={n.id} className="hover:bg-accent/40">
                  <td className="px-4 py-2 font-mono text-xs">{n.code}</td>
                  <td className="px-4 py-2 font-medium">{n.name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                        n.active
                          ? "bg-cv-success-soft text-cv-success-strong"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {n.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {n.hasSecret ? (
                      <span className="text-xs text-cv-success-strong">✓ Configured</span>
                    ) : (
                      <span className="text-xs text-cv-accent-strong">⚠ Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/networks/${n.id}`}
                      className="text-xs font-medium text-cv-primary hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
