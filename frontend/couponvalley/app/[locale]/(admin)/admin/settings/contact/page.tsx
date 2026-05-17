import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { SettingsForm } from "@/features/admin/components/SettingsForm";
import { fetchAdminSettings } from "@/lib/admin/settings-fetch";

export const metadata: Metadata = {
  title: "Admin · Contact settings",
  robots: { index: false },
};

export default async function ContactSettingsPage() {
  const initial = await fetchAdminSettings();
  return (
    <div>
      <AdminPageHeader
        back={{ label: "Settings", href: "/admin/settings" }}
        title="Contact"
        description="Email, phone, and mailing address shown in the footer + contact page."
      />
      <div className="rounded-lg border bg-card p-6">
        <SettingsForm
          initial={initial}
          fields={[
            { key: "contact.email", label: "Email", placeholder: "hello@…" },
            { key: "contact.phone", label: "Phone" },
            { key: "contact.address_line1", label: "Address line 1" },
            { key: "contact.address_line2", label: "Address line 2" },
            { key: "contact.address_line3", label: "Address line 3" },
          ]}
        />
      </div>
    </div>
  );
}
