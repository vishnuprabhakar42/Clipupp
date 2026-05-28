import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { AdminNewsletterRow, SpringPage } from "@/lib/api/admin";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin · Newsletter",
  robots: { index: false },
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type SearchParams = Promise<{ page?: string; status?: string }>;

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "0") || 0;
  const status = sp.status ?? "";
  const url = `/api/v1/admin/newsletter/subscribers?page=${page}&size=50${status ? `&status=${status}` : ""}`;
  const data = await adminFetch<SpringPage<AdminNewsletterRow>>(url);
  const subs = data?.content ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Newsletter subscribers"
        description={`${data?.totalElements ?? 0} subscribers total. CSV export pulls all CONFIRMED rows.`}
        actions={
          <a
            href={`${API_BASE}/api/v1/admin/newsletter/subscribers.csv`}
            className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download CSV
          </a>
        }
      />

      <form className="mb-4 flex flex-wrap items-center gap-2" action="/admin/newsletter">
        <label className="text-sm text-muted-foreground">Status:</label>
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="UNSUBSCRIBED">Unsubscribed</option>
        </select>
        <button
          type="submit"
          className="rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Locale</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Subscribed</th>
              <th className="px-4 py-2">Confirmed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subs.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 font-medium">{s.email}</td>
                <td className="px-4 py-2">{s.locale}</td>
                <td className="px-4 py-2">{s.status}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {s.confirmedAt ? new Date(s.confirmedAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No subscribers yet.
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
              <Link
                href={`/admin/newsletter?page=${data.number - 1}${status ? `&status=${status}` : ""}`}
                className="rounded-md border px-3 py-1 hover:bg-accent"
              >
                Previous
              </Link>
            )}
            {!data.last && (
              <Link
                href={`/admin/newsletter?page=${data.number + 1}${status ? `&status=${status}` : ""}`}
                className="rounded-md border px-3 py-1 hover:bg-accent"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
