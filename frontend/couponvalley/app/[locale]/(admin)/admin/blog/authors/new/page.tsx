import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AuthorForm } from "@/features/admin/components/AuthorForm";

export const metadata: Metadata = {
  title: "Admin · New author",
  robots: { index: false },
};

export default function NewAuthorPage() {
  return (
    <div>
      <AdminPageHeader
        back={{ label: "All authors", href: "/admin/blog/authors" }}
        title="New author"
        description="Authors appear on the blog post byline. Slug auto-derives from name when blank."
      />
      <div className="rounded-lg border bg-card p-6">
        <AuthorForm mode="create" />
      </div>
    </div>
  );
}
