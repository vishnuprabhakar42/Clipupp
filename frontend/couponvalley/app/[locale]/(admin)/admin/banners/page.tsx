import type { Metadata } from "next";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { AdminBannerRow } from "@/lib/api/admin";
import { AdminPageHeader, AdminPrimaryLink } from "@/features/admin/components/AdminPageHeader";
import { BannersReorderEditor } from "@/features/admin/components/BannersReorderEditorLazy";

export const metadata: Metadata = {
  title: "Admin · Banners",
  robots: { index: false },
};

export default async function AdminBannersPage() {
  const banners = (await adminFetch<AdminBannerRow[]>("/api/v1/admin/banners")) ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Homepage banners"
        description="Hero carousel, top announcement bar, and promo cards. Drag to reorder — the order here is the order on the home page."
        actions={<AdminPrimaryLink href="/admin/banners/new">New banner</AdminPrimaryLink>}
      />
      <BannersReorderEditor initial={banners} />
    </div>
  );
}
