import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminFetch } from "@/lib/admin/server-fetch";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { CampaignForm } from "@/features/admin/components/CampaignForm";
import type { CampaignDetail } from "@/lib/api/campaigns";

export const metadata: Metadata = {
  title: "Admin · Edit campaign",
  robots: { index: false },
};

type Params = Promise<{ id: string; locale: string }>;

export default async function EditCampaignPage({ params }: { params: Params }) {
  const { id } = await params;
  const campaign = await adminFetch<CampaignDetail>(`/api/v1/admin/campaigns/${id}`);
  if (!campaign) notFound();

  return (
    <div>
      <AdminPageHeader
        back={{ label: "All campaigns", href: "/admin/campaigns" }}
        title={`Edit: ${campaign.name}`}
        description={
          <span>
            <code className="rounded bg-muted px-1 font-mono text-xs">{campaign.slug}</code>
            {" · "}
            {new Date(campaign.startsAt).toLocaleString()} →{" "}
            {new Date(campaign.endsAt).toLocaleString()}
            {!campaign.active && (
              <span className="ml-2 rounded-full bg-cv-accent-soft px-2 py-0.5 text-[10px] font-medium uppercase text-cv-accent-strong">
                Paused
              </span>
            )}
          </span>
        }
      />
      <div className="rounded-lg border bg-card p-6">
        <CampaignForm mode="edit" initial={campaign} />
      </div>
    </div>
  );
}
