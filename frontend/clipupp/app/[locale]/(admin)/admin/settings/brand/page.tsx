import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { SettingsForm } from "@/features/admin/components/SettingsForm";
import { fetchAdminSettings } from "@/lib/admin/settings-fetch";

export const metadata: Metadata = {
  title: "Admin · Brand settings",
  robots: { index: false },
};

export default async function BrandSettingsPage() {
  const initial = await fetchAdminSettings();
  return (
    <div>
      <AdminPageHeader
        back={{ label: "Settings", href: "/admin/settings" }}
        title="Brand"
        description="Site identity — name, tagline, color palette, and logo. Affects header, footer, and OG images."
      />
      <div className="rounded-lg border bg-card p-6">
        <SettingsForm
          initial={initial}
          fields={[
            { key: "brand.name", label: "Site name" },
            { key: "brand.tagline", label: "Tagline", type: "textarea" },
            { key: "brand.primary_color", label: "Primary color", type: "color" },
            { key: "brand.accent_color", label: "Accent color", type: "color" },
            { key: "brand.logo_url", label: "Logo", type: "image", hint: "Used in OG images and the header. Wide format recommended." },
          ]}
        />
      </div>
    </div>
  );
}
