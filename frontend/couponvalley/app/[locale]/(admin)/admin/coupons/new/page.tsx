import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { NewCouponForm } from "@/features/admin/components/NewCouponForm";

export const metadata: Metadata = {
  title: "Admin · New coupon",
  robots: { index: false },
};

export default function NewCouponPage() {
  return (
    <div>
      <AdminPageHeader
        back={{ label: "All coupons", href: "/admin/coupons" }}
        title="New coupon"
        description="Pick the parent store, choose a type, fill in the title + description. Slug auto-composes."
      />
      <div className="rounded-lg border bg-card p-6">
        <NewCouponForm />
      </div>
    </div>
  );
}
