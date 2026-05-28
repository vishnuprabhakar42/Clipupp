import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { LegalPageSummary } from "@/lib/api/legalPages";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";

export const metadata: Metadata = {
  title: "Admin · Legal pages",
  robots: { index: false },
};

export default async function LegalPagesAdminPage() {
  const pages = (await adminFetch<LegalPageSummary[]>("/api/v1/admin/legal-pages")) ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Legal & info pages"
        description="Edit the markdown copy that powers /privacy, /terms, /cookie-policy and /affiliate-disclosure."
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {pages.map((p) => (
          <li key={p.slug} className="rounded-lg border bg-card p-4">
            <p className="text-xs font-mono text-muted-foreground">/{p.slug}</p>
            <p className="mt-1 text-lg font-semibold">{p.title}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated {new Date(p.updatedAt).toLocaleString()}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <Link
                href={`/admin/legal-pages/${p.slug}`}
                className="font-medium text-primary hover:underline"
              >
                Edit
              </Link>
              <Link
                href={`/${p.slug}`}
                target="_blank"
                className="text-muted-foreground hover:underline"
              >
                View ↗
              </Link>
            </div>
          </li>
        ))}
        {pages.length === 0 && (
          <li className="text-sm text-muted-foreground">
            No legal pages found. The V014 migration seeds privacy, terms, cookie-policy and
            affiliate-disclosure — make sure it ran (check Flyway logs).
          </li>
        )}
      </ul>
    </div>
  );
}
