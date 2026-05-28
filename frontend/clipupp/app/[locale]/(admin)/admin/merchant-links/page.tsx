import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { AdminMerchantLinkRow, AdminNetworkRow } from "@/lib/api/admin";
import type { CursorPage } from "@/lib/api/types";
import { AdminPageHeader, AdminPrimaryLink } from "@/features/admin/components/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin · Merchant links",
  robots: { index: false },
};

type StoreSummary = { id: string; name: string; slug: string };
type SearchParams = Promise<{ storeId?: string }>;

export default async function AdminMerchantLinksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const [storesPage, networks] = await Promise.all([
    adminFetch<CursorPage<StoreSummary>>("/api/v1/stores?limit=100"),
    adminFetch<AdminNetworkRow[]>("/api/v1/admin/affiliate-networks"),
  ]);
  const stores = storesPage?.data ?? [];
  const networksById = new Map((networks ?? []).map((n) => [n.id, n]));
  const selectedStoreId = sp.storeId ?? stores[0]?.id;
  const links = selectedStoreId
    ? (await adminFetch<AdminMerchantLinkRow[]>(
        `/api/v1/admin/merchant-network-links?storeId=${selectedStoreId}`
      )) ?? []
    : [];

  return (
    <div>
      <AdminPageHeader
        title="Merchant network links"
        description="Per-store deeplink templates. The highest-priority active link wins for /r/{couponId}."
        actions={
          selectedStoreId ? (
            <AdminPrimaryLink href={`/admin/merchant-links/new?storeId=${selectedStoreId}`}>
              New link
            </AdminPrimaryLink>
          ) : null
        }
      />

      {stores.length > 0 && (
        <form className="mb-4 flex flex-wrap items-center gap-2" action="/admin/merchant-links">
          <label className="text-sm text-muted-foreground">Store:</label>
          <select
            name="storeId"
            defaultValue={selectedStoreId}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent"
          >
            Switch
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Network</th>
              <th className="px-4 py-2">Advertiser id</th>
              <th className="px-4 py-2">Template</th>
              <th className="px-4 py-2 text-right">Priority</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {links.map((l) => (
              <tr key={l.id} className="hover:bg-accent/40">
                <td className="px-4 py-2 font-medium">
                  {networksById.get(l.networkId)?.name ?? l.networkId}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{l.advertiserId}</td>
                <td className="px-4 py-2 font-mono text-xs line-clamp-1 max-w-[480px]">
                  {l.deeplinkTemplate}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{l.priority}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                      l.active
                        ? "bg-clipupp-success-soft text-clipupp-success-strong"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {l.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/admin/merchant-links/${l.id}`}
                    className="text-xs font-medium text-clipupp-primary hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No links for this store.{" "}
                  {selectedStoreId && (
                    <Link
                      href={`/admin/merchant-links/new?storeId=${selectedStoreId}`}
                      className="text-foreground hover:underline"
                    >
                      Create one
                    </Link>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
