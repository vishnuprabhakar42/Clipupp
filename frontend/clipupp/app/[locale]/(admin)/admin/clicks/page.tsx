import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { AdminClickRow, SpringPage } from "@/lib/api/admin";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin · Clicks",
  robots: { index: false },
};

type SearchParams = Promise<{ page?: string }>;

export default async function AdminClicksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "0") || 0;
  const data = await adminFetch<SpringPage<AdminClickRow>>(
    `/api/v1/admin/clicks?page=${page}&size=50`
  );
  const clicks = data?.content ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Click stream"
        description={`${data?.totalElements ?? 0} clicks total. Newest first.`}
      />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Coupon</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">IP</th>
              <th className="px-4 py-2">Outbound URL</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clicks.map((c) => (
              <tr key={c.id} className="font-mono text-xs">
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">{c.userId ?? "—"}</td>
                <td className="px-4 py-2">{c.couponId.slice(0, 8)}…</td>
                <td className="px-4 py-2">{c.source ?? "—"}</td>
                <td className="px-4 py-2">{c.ipInet ?? "—"}</td>
                <td className="px-4 py-2 max-w-[280px] truncate">{c.outboundUrl}</td>
              </tr>
            ))}
            {clicks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No clicks recorded yet.
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
              <Link href={`/admin/clicks?page=${data.number - 1}`} className="rounded-md border px-3 py-1 hover:bg-accent">
                Previous
              </Link>
            )}
            {!data.last && (
              <Link href={`/admin/clicks?page=${data.number + 1}`} className="rounded-md border px-3 py-1 hover:bg-accent">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
