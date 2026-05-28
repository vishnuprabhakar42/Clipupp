import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminFetch } from "@/lib/admin/server-fetch";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { MerchantLinkForm } from "@/features/admin/components/NewMerchantLinkForm";
import type { AdminMerchantLinkRow } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Admin · Edit merchant link",
  robots: { index: false },
};

type Params = Promise<{ id: string; locale: string }>;

export default async function EditMerchantLinkPage({ params }: { params: Params }) {
  const { id } = await params;
  const link = await adminFetch<AdminMerchantLinkRow>(
    `/api/v1/admin/merchant-network-links/${id}`
  );
  if (!link) notFound();

  return (
    <div>
      <AdminPageHeader
        back={{ label: "All merchant links", href: "/admin/merchant-links" }}
        title="Edit merchant link"
        description={
          <span>
            Advertiser <code className="rounded bg-muted px-1 font-mono text-xs">{link.advertiserId}</code>
            {" · "}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                link.active ? "bg-clipupp-success-soft text-clipupp-success-strong" : "bg-gray-100 text-gray-600"
              }`}
            >
              {link.active ? "Active" : "Inactive"}
            </span>
          </span>
        }
      />
      <div className="rounded-lg border bg-card p-6">
        <MerchantLinkForm mode="edit" initial={link} />
      </div>
    </div>
  );
}
