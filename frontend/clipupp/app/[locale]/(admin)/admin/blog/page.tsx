import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { AdminArticleRow, AdminAuthorRow, SpringPage } from "@/lib/api/admin";
import { AdminPageHeader, AdminPrimaryLink } from "@/features/admin/components/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin · Blog",
  robots: { index: false },
};

type SearchParams = Promise<{ status?: string; page?: string }>;

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const usp = new URLSearchParams();
  if (sp.status) usp.append("status", sp.status);
  usp.append("page", sp.page ?? "0");
  usp.append("size", "50");

  const [articlesPage, authors] = await Promise.all([
    adminFetch<SpringPage<AdminArticleRow>>(
      `/api/v1/admin/blog/articles?${usp.toString()}`
    ),
    adminFetch<AdminAuthorRow[]>("/api/v1/admin/blog/authors"),
  ]);
  const articles = articlesPage?.content ?? [];
  const authorById = new Map((authors ?? []).map((a) => [a.id, a]));
  const currentPage = articlesPage?.number ?? 0;
  const hasNext = articlesPage ? !articlesPage.last : false;
  const hasPrev = articlesPage ? !articlesPage.first : false;

  function pageHref(p: number) {
    const next = new URLSearchParams(usp);
    next.set("page", String(p));
    return `/admin/blog?${next.toString()}`;
  }

  return (
    <div className="space-y-8">
      <section>
        <AdminPageHeader
          title="Articles"
          description={
            <span>
              Drafts, scheduled, and published posts. Filter via{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">?status=DRAFT</code> /{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">PUBLISHED</code>.
            </span>
          }
          actions={
            <>
              <Link
                href="/admin/blog/authors"
                className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Authors
              </Link>
              <AdminPrimaryLink href="/admin/blog/new">New article</AdminPrimaryLink>
            </>
          }
        />
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Slug</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Author</th>
                <th className="px-4 py-2">Published</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {articles.map((a) => (
                <tr key={a.id} className="hover:bg-accent/40">
                  <td className="px-4 py-2 font-medium line-clamp-1">{a.title}</td>
                  <td className="px-4 py-2 font-mono text-xs">{a.slug}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{authorById.get(a.authorId)?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {a.publishedAt
                      ? new Date(a.publishedAt).toLocaleDateString()
                      : a.scheduledFor
                      ? `→ ${new Date(a.scheduledFor).toLocaleDateString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-3">
                      <Link
                        href={`/admin/blog/${a.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Edit
                      </Link>
                      {a.status === "PUBLISHED" && (
                        <Link
                          href={`/blog/${a.slug}`}
                          target="_blank"
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          View ↗
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No articles yet.{" "}
                    <Link href="/admin/blog/new" className="text-primary hover:underline">
                      Write the first one →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {(hasPrev || hasNext) && (
          <div className="mt-4 flex items-center justify-center gap-3">
            {hasPrev && (
              <Link
                href={pageHref(currentPage - 1)}
                className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Previous
              </Link>
            )}
            <span className="text-sm text-muted-foreground">Page {currentPage + 1}</span>
            {hasNext && (
              <Link
                href={pageHref(currentPage + 1)}
                className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
