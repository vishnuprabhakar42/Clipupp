import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { SettingsForm } from "@/features/admin/components/SettingsForm";
import { fetchAdminSettings } from "@/lib/admin/settings-fetch";

export const metadata: Metadata = {
  title: "Admin · SEO defaults",
  robots: { index: false },
};

export default async function SeoSettingsPage() {
  const initial = await fetchAdminSettings();
  return (
    <div>
      <AdminPageHeader
        back={{ label: "Settings", href: "/admin/settings" }}
        title="SEO defaults"
        description="Fallback meta tags + default OG image used when a page doesn't supply its own."
      />
      <div className="rounded-lg border bg-card p-6">
        <SettingsForm
          initial={initial}
          fields={[
            {
              key: "seo.default_title_template",
              label: "Default title template",
              hint: "Use %s where the page title goes. Example: \"%s · Clipupp\".",
              placeholder: "%s · Clipupp",
            },
            { key: "seo.default_description", label: "Default meta description", type: "textarea" },
            {
              key: "seo.og_image",
              label: "Default OG image",
              type: "image",
              hint: "1200×630 recommended. Used when a page doesn't define its own.",
            },
          ]}
        />
      </div>
    </div>
  );
}
