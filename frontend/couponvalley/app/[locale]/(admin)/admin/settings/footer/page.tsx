import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { SettingsForm } from "@/features/admin/components/SettingsForm";
import { fetchAdminSettings } from "@/lib/admin/settings-fetch";

export const metadata: Metadata = {
  title: "Admin · Footer settings",
  robots: { index: false },
};

export default async function FooterSettingsPage() {
  const initial = await fetchAdminSettings();
  return (
    <div>
      <AdminPageHeader
        back={{ label: "Settings", href: "/admin/settings" }}
        title="Footer"
        description="Disclosure copy, commission note, and the bottom hashtag mark."
      />
      <div className="rounded-lg border bg-card p-6">
        <SettingsForm
          initial={initial}
          fields={[
            { key: "footer.disclosure", label: "Affiliate disclosure", type: "textarea" },
            { key: "footer.commission_note", label: "Commission note (brand block)", type: "textarea" },
            { key: "footer.hashtag", label: "Hashtag mark", placeholder: "#SaveWithClipUpp" },
          ]}
        />
      </div>
    </div>
  );
}
