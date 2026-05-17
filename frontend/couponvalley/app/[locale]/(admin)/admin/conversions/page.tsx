import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { AdminConversionRow, SpringPage } from "@/lib/api/admin";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin · Conversions",
  robots: { index: false },
};

type SearchParams = Promise<{ page?: string }>;

export default async function AdminConversionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "0") || 0;
  const data = await adminFetch<SpringPage<AdminConversionRow>>(
    `/api/v1/admin/conversions?page=${page}&size=50`
  );
  const rows = data?.content ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Conversions"
        description={`${data?.totalElements ?? 0} conversion rows. Wallet credits go live in Phase 2.`}
      />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">State</th>
              <th className="px-4 py-2">Network txn</th>
              <th className="px-4 py-2">Click</th>
              <th className="px-4 py-2 text-right">Order</th>
              <th className="px-4 py-2 text-right">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${
                    c.state === "APPROVED"
                      ? "bg-cv-success-soft text-cv-success-strong"
                      : c.state === "REJECTED" || c.state === "REVERSED"
                        ? "bg-cv-accent-soft text-cv-accent-strong"
                        : "bg-cv-accent-soft text-cv-accent-strong"
                  }`}>
                    {c.state}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{c.networkTxnId}</td>
                <td className="px-4 py-2 font-mono text-xs">
                  {c.clickId ? c.clickId.slice(0, 8) + "…" : "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {c.orderAmount && c.orderCurrency ? `${c.orderAmount} ${c.orderCurrency}` : "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {c.commissionAmount && c.commissionCurrency
                    ? `${c.commissionAmount} ${c.commissionCurrency}`
                    : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No conversions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.number + 1} of {data.totalPages}
          </span>
          <div className="flex gap-2">
            {!data.first && (
              <Link href={`/admin/conversions?page=${data.number - 1}`} className="rounded-md border px-3 py-1 hover:bg-accent">
                Previous
              </Link>
            )}
            {!data.last && (
              <Link href={`/admin/conversions?page=${data.number + 1}`} className="rounded-md border px-3 py-1 hover:bg-accent">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
