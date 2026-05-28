import type { Metadata } from "next";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ArticleForm } from "@/features/admin/components/ArticleForm";

export const metadata: Metadata = {
  title: "Admin · New article",
  robots: { index: false },
};

export default function NewArticlePage() {
  return (
    <div>
      <AdminPageHeader
        back={{ label: "All articles", href: "/admin/blog" }}
        title="New article"
        description="Drafts are private until you publish. Hero image is optional but recommended for OG cards."
      />
      <div className="rounded-lg border bg-card p-6">
        <ArticleForm mode="create" />
      </div>
    </div>
  );
}
