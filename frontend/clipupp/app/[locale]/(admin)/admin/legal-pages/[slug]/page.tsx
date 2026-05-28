import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminFetch } from "@/lib/admin/server-fetch";
import type { LegalPageDetail } from "@/lib/api/legalPages";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { LegalPageForm } from "@/features/admin/components/LegalPageForm";

export const metadata: Metadata = {
  title: "Admin · Edit legal page",
  robots: { index: false },
};

type Params = Promise<{ slug: string; locale: string }>;

export default async function EditLegalPage({ params }: { params: Params }) {
  const { slug } = await params;
  const page = await adminFetch<LegalPageDetail>(`/api/v1/admin/legal-pages/${slug}`);
  if (!page) notFound();

  return (
    <div>
      <AdminPageHeader
        back={{ label: "All legal pages", href: "/admin/legal-pages" }}
        title={`Edit: ${page.title}`}
        description="Markdown body. The public site renders this directly via /api/v1/legal-pages/{slug}."
      />
      <div className="rounded-lg border bg-card p-6">
        <LegalPageForm initial={page} />
      </div>
    </div>
  );
}
