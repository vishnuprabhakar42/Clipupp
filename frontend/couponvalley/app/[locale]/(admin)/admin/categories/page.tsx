import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { AdminCategoryDetail } from "@/lib/api/admin";
import { AdminPageHeader, AdminPrimaryLink } from "@/features/admin/components/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin · Categories",
  robots: { index: false },
};

export default async function AdminCategoriesPage() {
  const all = (await adminFetch<AdminCategoryDetail[]>("/api/v1/admin/categories")) ?? [];

  // Group by parent so admins see the hierarchy at a glance.
  const roots = all.filter((c) => !c.parentId);
  const childrenByParent = new Map<string, AdminCategoryDetail[]>();
  for (const c of all) {
    if (c.parentId) {
      const arr = childrenByParent.get(c.parentId) ?? [];
      arr.push(c);
      childrenByParent.set(c.parentId, arr);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Active and inactive categories. Click Edit to toggle visibility, change icon, or reorder."
        actions={<AdminPrimaryLink href="/admin/categories/new">New category</AdminPrimaryLink>}
      />
      {all.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <ul className="space-y-2">
          {roots.map((cat) => {
            const kids = childrenByParent.get(cat.id) ?? [];
            return (
              <li key={cat.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-semibold">
                      {cat.title}
                      {!cat.active && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                          Inactive
                        </span>
                      )}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">{cat.slug}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <Link href={`/admin/categories/${cat.id}`} className="font-medium text-primary hover:underline">
                      Edit
                    </Link>
                    <Link
                      href={`/categories/${cat.slug}`}
                      target="_blank"
                      className="text-muted-foreground hover:underline"
                    >
                      View ↗
                    </Link>
                  </div>
                </div>
                {kids.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {kids.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/admin/categories/${child.id}`}
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            child.active
                              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              : "bg-muted text-muted-foreground line-through"
                          }`}
                        >
                          {child.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
