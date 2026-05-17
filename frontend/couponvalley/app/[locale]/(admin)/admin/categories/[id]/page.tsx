import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminFetch } from "@/lib/admin/server-fetch";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { CategoryForm } from "@/features/admin/components/NewCategoryForm";
import type { AdminCategoryDetail } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Admin · Edit category",
  robots: { index: false },
};

type Params = Promise<{ id: string; locale: string }>;

export default async function EditCategoryPage({ params }: { params: Params }) {
  const { id } = await params;
  const category = await adminFetch<AdminCategoryDetail>(`/api/v1/admin/categories/${id}`);
  if (!category) notFound();

  return (
    <div>
      <AdminPageHeader
        back={{ label: "All categories", href: "/admin/categories" }}
        title={`Edit: ${category.title}`}
        description={
          <span>
            Slug <code className="rounded bg-muted px-1 font-mono text-xs">{category.slug}</code>
            {!category.active && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                Inactive
              </span>
            )}
          </span>
        }
      />
      <div className="rounded-lg border bg-card p-6">
        <CategoryForm mode="edit" initial={category} />
      </div>
    </div>
  );
}
