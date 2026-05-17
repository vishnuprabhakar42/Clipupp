import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { NewCategoryForm } from "@/features/admin/components/NewCategoryForm";

export const metadata: Metadata = {
  title: "Admin · New category",
  robots: { index: false },
};

export default function NewCategoryPage() {
  return (
    <div>
      <AdminPageHeader
        back={{ label: "All categories", href: "/admin/categories" }}
        title="New category"
        description="Add a category to organize stores and coupons."
      />
      <div className="rounded-lg border bg-card p-6">
        <NewCategoryForm />
      </div>
    </div>
  );
}
