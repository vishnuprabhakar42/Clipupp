import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { StoreForm } from "@/features/admin/components/NewStoreForm";
import type { AdminStoreDetail } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Admin · Edit store",
  robots: { index: false },
};

type Params = Promise<{ id: string; locale: string }>;

export default async function EditStorePage({ params }: { params: Params }) {
  const { id } = await params;
  const store = await adminFetch<AdminStoreDetail>(`/api/v1/admin/stores/${id}`);
  if (!store) notFound();

  return (
    <div>
      <AdminPageHeader
        back={{ label: "All stores", href: "/admin/stores" }}
        title={`Edit ${store.name}`}
        description={
          <span>
            Slug <code className="rounded bg-muted px-1 font-mono text-xs">{store.slug}</code>
            {" · "}
            <Link href={`/stores/${store.slug}`} target="_blank" className="hover:underline">
              View on site ↗
            </Link>
            {store.deletedAt && (
              <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                Deleted
              </span>
            )}
          </span>
        }
      />
      <div className="rounded-lg border bg-card p-6">
        <StoreForm mode="edit" initial={store} />
      </div>
    </div>
  );
}
