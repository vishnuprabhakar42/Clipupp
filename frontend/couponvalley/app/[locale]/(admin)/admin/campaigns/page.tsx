import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { CampaignSummary } from "@/lib/api/campaigns";
import { AdminPageHeader, AdminPrimaryLink } from "@/features/admin/components/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin · Campaigns",
  robots: { index: false },
};

function status(c: CampaignSummary): "Active" | "Scheduled" | "Ended" | "Paused" {
  if (!c.active) return "Paused";
  const now = new Date();
  const start = new Date(c.startsAt);
  const end = new Date(c.endsAt);
  if (now < start) return "Scheduled";
  if (now > end) return "Ended";
  return "Active";
}

export default async function CampaignsAdminPage() {
  const campaigns = (await adminFetch<CampaignSummary[]>("/api/v1/admin/campaigns")) ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Campaigns"
        description="Time-bounded promos. The active campaign overrides hero / announcement copy on the public site."
        actions={<AdminPrimaryLink href="/admin/campaigns/new">New campaign</AdminPrimaryLink>}
      />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Window</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {campaigns.map((c) => {
              const s = status(c);
              return (
                <tr key={c.id} className="hover:bg-accent/40">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-2 text-xs">
                    {new Date(c.startsAt).toLocaleString()} → {new Date(c.endsAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                        s === "Active"
                          ? "bg-cv-success-soft text-cv-success-strong"
                          : s === "Scheduled"
                          ? "bg-cv-primary-soft text-cv-primary-strong"
                          : s === "Ended"
                          ? "bg-muted text-muted-foreground"
                          : "bg-cv-accent-soft text-cv-accent-strong"
                      }`}
                    >
                      {s}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/campaigns/${c.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No campaigns yet.{" "}
                  <Link href="/admin/campaigns/new" className="text-primary hover:underline">
                    Plan one →
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
