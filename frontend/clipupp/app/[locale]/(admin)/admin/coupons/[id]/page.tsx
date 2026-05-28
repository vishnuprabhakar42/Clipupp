import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { CouponForm } from "@/features/admin/components/NewCouponForm";
import type { AdminCouponDetail } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Admin · Edit coupon",
  robots: { index: false },
};

type Params = Promise<{ id: string; locale: string }>;

export default async function EditCouponPage({ params }: { params: Params }) {
  const { id } = await params;
  const coupon = await adminFetch<AdminCouponDetail>(`/api/v1/admin/coupons/${id}`);
  if (!coupon) notFound();

  return (
    <div>
      <AdminPageHeader
        back={{ label: "All coupons", href: "/admin/coupons" }}
        title={`Edit: ${coupon.title}`}
        description={
          <span>
            Slug <code className="rounded bg-muted px-1 font-mono text-xs">{coupon.slug}</code>
            {" · Store: "}
            {coupon.storeSlug ? (
              <Link href={`/admin/stores/${coupon.storeId}`} className="hover:underline">
                {coupon.storeName}
              </Link>
            ) : (
              <span>{coupon.storeName ?? "—"}</span>
            )}
            {" · "}
            <Link href={`/coupons/${coupon.slug}`} target="_blank" className="hover:underline">
              View on site ↗
            </Link>
            {coupon.deletedAt && (
              <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                Deleted
              </span>
            )}
          </span>
        }
      />
      <div className="rounded-lg border bg-card p-6">
        <CouponForm mode="edit" initial={coupon} />
      </div>
    </div>
  );
}
