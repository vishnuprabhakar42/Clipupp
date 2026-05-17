import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { CampaignForm } from "@/features/admin/components/CampaignForm";

export const metadata: Metadata = {
  title: "Admin · New campaign",
  robots: { index: false },
};

export default function NewCampaignPage() {
  return (
    <div>
      <AdminPageHeader
        back={{ label: "All campaigns", href: "/admin/campaigns" }}
        title="New campaign"
        description="Plan a time-bounded promo. Activates within its window once enabled."
      />
      <div className="rounded-lg border bg-card p-6">
        <CampaignForm mode="create" />
      </div>
    </div>
  );
}
