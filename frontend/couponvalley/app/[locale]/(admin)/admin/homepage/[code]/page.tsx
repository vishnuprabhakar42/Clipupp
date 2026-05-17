import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { FeaturedItem, FeaturedType } from "@/lib/api/homepage";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { FeaturedItemsEditor } from "@/features/admin/components/FeaturedItemsEditorLazy";

export const metadata: Metadata = {
  title: "Admin · Featured items",
  robots: { index: false },
};

const SECTION_TO_TYPE: Record<string, FeaturedType | undefined> = {
  trending_stores: "stores",
  featured_stores: "stores",
  trusted_brands: "stores",
  top_deals: "coupons",
  popular_categories: "categories",
};

const SECTION_TITLES: Record<string, string> = {
  trending_stores: "Trending stores",
  featured_stores: "Featured stores",
  trusted_brands: "Trusted brands",
  top_deals: "Top deals",
  popular_categories: "Popular categories",
};

type Params = Promise<{ code: string; locale: string }>;

export default async function FeaturedSectionAdmin({ params }: { params: Params }) {
  const { code } = await params;
  const type = SECTION_TO_TYPE[code];
  if (!type) notFound();

  const items =
    (await adminFetch<FeaturedItem[]>(`/api/v1/admin/homepage/featured/${type}`)) ?? [];

  return (
    <div>
      <AdminPageHeader
        back={{ label: "Homepage layout", href: "/admin/homepage" }}
        title={`Featured ${type} · ${SECTION_TITLES[code] ?? code}`}
        description="Pin specific items to this homepage section. Items not in the list fall back to the default popularity-sorted ranking."
      />
      <FeaturedItemsEditor type={type} initial={items} />
    </div>
  );
}
