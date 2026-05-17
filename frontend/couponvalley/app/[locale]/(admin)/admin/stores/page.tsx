import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { CursorPage } from "@/lib/api/types";
import { AdminPageHeader, AdminPrimaryLink } from "@/features/admin/components/AdminPageHeader";
import { StoresBulkBar } from "@/features/admin/components/StoresBulkBar";

export const metadata: Metadata = {
  title: "Admin · Stores",
  robots: { index: false },
};

type StoreRow = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  shortDescription: string | null;
  rating: string | null;
  reviewCount: number;
  countryCode: string;
  popularityScore: number;
};

type SearchParams = Promise<{ cursor?: string }>;

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const usp = new URLSearchParams();
  if (sp.cursor) usp.append("cursor", sp.cursor);
  usp.append("limit", "50");
  const data = await adminFetch<CursorPage<StoreRow>>(`/api/v1/stores?${usp.toString()}`);
  const stores = data?.data ?? [];
  const nextCursor = data?.page.nextCursor ?? null;

  return (
    <div>
      <AdminPageHeader
        title="Stores"
        description="Every merchant we feature. Slug-driven URLs power /stores/[slug] and /coupons filtering."
        actions={<AdminPrimaryLink href="/admin/stores/new">New store</AdminPrimaryLink>}
      />
      <StoresBulkBar />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-8 px-2 py-2"></th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Country</th>
              <th className="px-4 py-2 text-right">Reviews</th>
              <th className="px-4 py-2 text-right">Popularity</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stores.map((s) => (
              <tr key={s.id} className="hover:bg-accent/40">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    aria-label={`Select ${s.name}`}
                    data-bulk-scope="store"
                    data-bulk-id={s.id}
                    className="h-4 w-4 rounded border"
                  />
                </td>
                <td className="px-4 py-2 font-medium">{s.name}</td>
                <td className="px-4 py-2 font-mono text-xs">{s.slug}</td>
                <td className="px-4 py-2">{s.countryCode}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {s.rating ? `${s.rating} (${s.reviewCount})` : "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{s.popularityScore}</td>
                <td className="px-4 py-2 text-right">
                  <div className="inline-flex items-center gap-3">
                    <Link
                      href={`/admin/stores/${s.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/stores/${s.slug}`}
                      target="_blank"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      View ↗
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No stores yet — create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {nextCursor && (
        <div className="mt-4 text-center">
          <Link
            href={`/admin/stores?cursor=${encodeURIComponent(nextCursor)}`}
            className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Load more
          </Link>
        </div>
      )}
    </div>
  );
}
