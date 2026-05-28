import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { NewMerchantLinkForm } from "@/features/admin/components/NewMerchantLinkForm";

export const metadata: Metadata = {
  title: "Admin · New merchant link",
  robots: { index: false },
};

type SearchParams = Promise<{ storeId?: string }>;

export default async function NewMerchantLinkPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  return (
    <div>
      <AdminPageHeader
        back={{ label: "All merchant links", href: "/admin/merchant-links" }}
        title="New merchant link"
        description="Templates can use {merchantUrl}, {sub_id}, {click_id}, {advertiser_id}, {network_code}."
      />
      <div className="rounded-lg border bg-card p-6">
        <NewMerchantLinkForm initialStoreId={sp.storeId} />
      </div>
    </div>
  );
}
