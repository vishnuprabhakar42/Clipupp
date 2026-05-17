import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminFetch } from "@/lib/admin/server-fetch";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { BannerForm } from "@/features/admin/components/NewBannerForm";
import type { AdminBannerRow } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Admin · Edit banner",
  robots: { index: false },
};

type Params = Promise<{ id: string; locale: string }>;

export default async function EditBannerPage({ params }: { params: Params }) {
  const { id } = await params;
  const banners = await adminFetch<AdminBannerRow[]>(`/api/v1/admin/banners`);
  const banner = banners?.find((b) => b.id === id);
  if (!banner) notFound();

  return (
    <div>
      <AdminPageHeader
        back={{ label: "All banners", href: "/admin/banners" }}
        title={`Edit: ${banner.title}`}
        description={
          banner.placement
            ? `Placement: ${banner.placement.replace("_", " ").toLowerCase()}`
            : "Configure where and when this banner appears."
        }
      />
      <div className="rounded-lg border bg-card p-6">
        <BannerForm mode="edit" initial={banner} />
      </div>
    </div>
  );
}
