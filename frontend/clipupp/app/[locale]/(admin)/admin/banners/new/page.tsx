import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { NewBannerForm } from "@/features/admin/components/NewBannerForm";

export const metadata: Metadata = {
  title: "Admin · New banner",
  robots: { index: false },
};

export default function NewBannerPage() {
  return (
    <div>
      <AdminPageHeader
        back={{ label: "All banners", href: "/admin/banners" }}
        title="New banner"
        description="Add a banner for the top bar, hero carousel, or promo cards."
      />
      <div className="rounded-lg border bg-card p-6">
        <NewBannerForm />
      </div>
    </div>
  );
}
