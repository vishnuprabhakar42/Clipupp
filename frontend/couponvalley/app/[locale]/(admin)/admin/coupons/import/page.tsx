import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { CouponImportWizard } from "@/features/admin/components/CouponImportWizard";

export const metadata: Metadata = {
  title: "Admin · Import coupons",
  robots: { index: false },
};

export default function CouponImportPage() {
  return (
    <div>
      <AdminPageHeader
        back={{ label: "All coupons", href: "/admin/coupons" }}
        title="Import coupons"
        description="Bulk-create or update coupons from a CSV. Match key is the slug; missing slugs are derived from storeSlug + title."
      />
      <CouponImportWizard />
    </div>
  );
}
