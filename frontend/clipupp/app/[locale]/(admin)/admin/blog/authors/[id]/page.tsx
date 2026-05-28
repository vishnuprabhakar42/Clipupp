import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminFetch } from "@/lib/admin/server-fetch";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AuthorForm } from "@/features/admin/components/AuthorForm";
import type { AdminAuthorRow } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Admin · Edit author",
  robots: { index: false },
};

type Params = Promise<{ id: string; locale: string }>;

export default async function EditAuthorPage({ params }: { params: Params }) {
  const { id } = await params;
  const author = await adminFetch<AdminAuthorRow>(`/api/v1/admin/blog/authors/${id}`);
  if (!author) notFound();

  return (
    <div>
      <AdminPageHeader
        back={{ label: "All authors", href: "/admin/blog/authors" }}
        title={`Edit: ${author.name}`}
        description={
          <span>
            Slug <code className="rounded bg-muted px-1 font-mono text-xs">{author.slug}</code>
          </span>
        }
      />
      <div className="rounded-lg border bg-card p-6">
        <AuthorForm mode="edit" initial={author} />
      </div>
    </div>
  );
}
