import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminFetch } from "@/lib/admin/server-fetch";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { ArticleForm } from "@/features/admin/components/ArticleForm";
import type { AdminArticleRow } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Admin · Edit article",
  robots: { index: false },
};

type Detail = AdminArticleRow & {
  bodyMd: string;
  metaTitle: string | null;
  metaDescription: string | null;
};

type Params = Promise<{ id: string; locale: string }>;

export default async function EditArticlePage({ params }: { params: Params }) {
  const { id } = await params;
  const article = await adminFetch<Detail>(`/api/v1/admin/blog/articles/${id}`);
  if (!article) notFound();

  return (
    <div>
      <AdminPageHeader
        back={{ label: "All articles", href: "/admin/blog" }}
        title={`Edit: ${article.title}`}
        description={
          <span>
            Slug <code className="rounded bg-muted px-1 font-mono text-xs">{article.slug}</code>
            {article.status === "PUBLISHED" && (
              <>
                {" · "}
                <Link href={`/blog/${article.slug}`} target="_blank" className="hover:underline">
                  View on site ↗
                </Link>
              </>
            )}
          </span>
        }
      />
      <div className="rounded-lg border bg-card p-6">
        <ArticleForm mode="edit" initial={article} />
      </div>
    </div>
  );
}
