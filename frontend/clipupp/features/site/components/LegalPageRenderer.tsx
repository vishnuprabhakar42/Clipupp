import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { legalPagesApi } from "@/lib/api/legalPages";
import { InfoPageShell } from "./InfoPageShell";
import { MarkdownView } from "@/features/admin/components/MarkdownView";

/**
 * Server-side renderer for any legal/info slug. Calls the backend with a 5-min
 * SSR cache window (server-side `next.revalidate`); the backend itself caches
 * for 60 min in Caffeine, so most requests are < 1 ms on the API.
 */
export async function renderLegalPage(slug: string) {
  const page = await legalPagesApi.getPublic(slug);
  if (!page) notFound();

  return (
    <InfoPageShell
      title={page.title}
      updated={new Date(page.updatedAt).toISOString().slice(0, 10)}
    >
      <MarkdownView source={page.bodyMd} />
    </InfoPageShell>
  );
}

export async function legalPageMetadata(slug: string, fallbackTitle: string): Promise<Metadata> {
  const page = await legalPagesApi.getPublic(slug);
  if (!page) {
    return { title: fallbackTitle };
  }
  return {
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? undefined,
    alternates: { canonical: `/${slug}` },
  };
}
