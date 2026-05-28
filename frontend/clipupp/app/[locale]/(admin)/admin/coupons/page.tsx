import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { AdminCouponSummary, SpringPage } from "@/lib/api/admin";
import { AdminPageHeader, AdminPrimaryLink } from "@/features/admin/components/AdminPageHeader";
import { CouponsBulkBar } from "@/features/admin/components/CouponsBulkBar";

export const metadata: Metadata = {
  title: "Admin · Coupons",
  robots: { index: false },
};

type SearchParams = Promise<{
  page?: string;
  q?: string;
  storeId?: string;
  status?: string;
  type?: string;
}>;

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const usp = new URLSearchParams();
  if (sp.q) usp.append("q", sp.q);
  if (sp.storeId) usp.append("storeId", sp.storeId);
  if (sp.status) usp.append("status", sp.status);
  if (sp.type) usp.append("type", sp.type);
  usp.append("page", sp.page ?? "0");
  usp.append("size", "50");

  const data = await adminFetch<SpringPage<AdminCouponSummary>>(
    `/api/v1/admin/coupons?${usp.toString()}`
  );
  const coupons = data?.content ?? [];
  const currentPage = data?.number ?? 0;
  const hasNext = data ? !data.last : false;
  const hasPrev = data ? !data.first : false;

  function pageHref(p: number) {
    const next = new URLSearchParams(usp);
    next.set("page", String(p));
    return `/admin/coupons?${next.toString()}`;
  }

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description="All coupons (active, hidden, expired). Use the filter URL params (?q=&storeId=&status=&type=) to narrow."
        actions={<AdminPrimaryLink href="/admin/coupons/new">New coupon</AdminPrimaryLink>}
      />
      <CouponsBulkBar />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-8 px-2 py-2"></th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Store</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Savings</th>
              <th className="px-4 py-2">Expires</th>
              <th className="px-4 py-2 text-right">Used</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-accent/40">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Select ${c.title}`}
                    data-bulk-scope="coupon"
                    data-bulk-id={c.id}
                    className="h-4 w-4 rounded border"
                  />
                </td>
                <td className="px-4 py-2 font-medium line-clamp-1">{c.title}</td>
                <td className="px-4 py-2 text-xs">{c.storeName ?? "—"}</td>
                <td className="px-4 py-2">{c.type}</td>
                <td className="px-4 py-2 font-mono">{c.code ?? "—"}</td>
                <td className="px-4 py-2">{c.savingsLabel ?? "—"}</td>
                <td className="px-4 py-2">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{c.usedCount}</td>
                <td className="px-4 py-2 text-right">
                  <div className="inline-flex items-center gap-3">
                    <Link
                      href={`/admin/coupons/${c.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/coupons/${c.slug}`}
                      target="_blank"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      View ↗
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No coupons match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(hasPrev || hasNext) && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {hasPrev && (
            <Link
              href={pageHref(currentPage - 1)}
              className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">Page {currentPage + 1}</span>
          {hasNext && (
            <Link
              href={pageHref(currentPage + 1)}
              className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
