import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { AdminAuthorRow } from "@/lib/api/admin";
import { AdminPageHeader, AdminPrimaryLink } from "@/features/admin/components/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin · Authors",
  robots: { index: false },
};

export default async function AuthorsPage() {
  const authors = (await adminFetch<AdminAuthorRow[]>("/api/v1/admin/blog/authors")) ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Authors"
        description="Bylines for blog posts. Add an author before writing the post."
        actions={<AdminPrimaryLink href="/admin/blog/authors/new">New author</AdminPrimaryLink>}
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((a) => (
          <li key={a.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              {a.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.avatarUrl} alt={a.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {a.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{a.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{a.slug}</p>
                {a.bio && <p className="mt-2 line-clamp-3 text-sm">{a.bio}</p>}
              </div>
            </div>
            <div className="mt-3 text-right">
              <Link
                href={`/admin/blog/authors/${a.id}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Edit
              </Link>
            </div>
          </li>
        ))}
        {authors.length === 0 && (
          <li className="text-sm text-muted-foreground">No authors yet.</li>
        )}
      </ul>
    </div>
  );
}
