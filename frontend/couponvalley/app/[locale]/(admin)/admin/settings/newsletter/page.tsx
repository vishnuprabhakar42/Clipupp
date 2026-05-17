import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { SettingsForm } from "@/features/admin/components/SettingsForm";
import { fetchAdminSettings } from "@/lib/admin/settings-fetch";

export const metadata: Metadata = {
  title: "Admin · Newsletter copy",
  robots: { index: false },
};

export default async function NewsletterCopyPage() {
  const initial = await fetchAdminSettings();
  return (
    <div>
      <AdminPageHeader
        back={{ label: "Settings", href: "/admin/settings" }}
        title="Newsletter copy"
        description="Copy shown above the subscribe form. Subscribers themselves are managed under People → Newsletter."
      />
      <div className="rounded-lg border bg-card p-6">
        <SettingsForm
          initial={initial}
          fields={[
            { key: "newsletter.headline", label: "Headline" },
            { key: "newsletter.subheadline", label: "Sub-headline", type: "textarea" },
            { key: "newsletter.cta", label: "CTA button text", placeholder: "Subscribe" },
          ]}
        />
      </div>
    </div>
  );
}
