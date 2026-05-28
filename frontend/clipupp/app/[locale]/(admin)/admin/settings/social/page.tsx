import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { SettingsForm } from "@/features/admin/components/SettingsForm";
import { fetchAdminSettings } from "@/lib/admin/settings-fetch";

export const metadata: Metadata = {
  title: "Admin · Social settings",
  robots: { index: false },
};

export default async function SocialSettingsPage() {
  const initial = await fetchAdminSettings();
  return (
    <div>
      <AdminPageHeader
        back={{ label: "Settings", href: "/admin/settings" }}
        title="Social"
        description="Footer social-icon links. Leave a field blank to hide the icon."
      />
      <div className="rounded-lg border bg-card p-6">
        <SettingsForm
          initial={initial}
          fields={[
            { key: "social.whatsapp", label: "WhatsApp", type: "url", placeholder: "https://wa.me/…" },
            { key: "social.facebook", label: "Facebook", type: "url" },
            { key: "social.x", label: "X / Twitter", type: "url" },
            { key: "social.linkedin", label: "LinkedIn", type: "url" },
            { key: "social.instagram", label: "Instagram", type: "url" },
            { key: "social.youtube", label: "YouTube", type: "url" },
          ]}
        />
      </div>
    </div>
  );
}
