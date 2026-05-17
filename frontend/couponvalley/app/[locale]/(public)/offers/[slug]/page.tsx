import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { offersApi } from "@/lib/api/coupons";
import { isApiError } from "@/lib/api/errors";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

async function load(slug: string) {
  try {
    return await offersApi.bySlug(slug);
  } catch (err) {
    if (isApiError(err) && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) return { title: "Offer not found", robots: { index: false } };
  return {
    title: detail.metaTitle ?? `${detail.title}${detail.store ? ` — ${detail.store.name}` : ""}`,
    description: detail.metaDescription ?? detail.description.slice(0, 160),
    alternates: { canonical: `/offers/${detail.slug}` },
  };
}

export default async function OfferDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) notFound();

  const expires = detail.expiresAt ? new Date(detail.expiresAt) : null;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      {detail.store && (
        <Link
          href={`/stores/${detail.store.slug}`}
          className="mb-6 inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded bg-muted p-1">
            <Image
              src={detail.store.logoUrl || "/placeholder.svg"}
              alt={detail.store.name}
              width={40}
              height={40}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
          <span>← Back to {detail.store.name}</span>
        </Link>
      )}

      <article className="rounded-md border bg-card p-6 md:p-8 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          {detail.savingsLabel && (
            <Badge className="bg-cv-primary text-white hover:bg-cv-primary-strong">{detail.savingsLabel}</Badge>
          )}
          {detail.verified && (
            <Badge variant="outline" className="border-cv-success/40 text-cv-success-strong">
              Verified
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] uppercase">
            {detail.type.replace("_", " ").toLowerCase()}
          </Badge>
        </div>

        <h1 className="text-2xl font-bold md:text-3xl">{detail.title}</h1>
        <p className="mt-2 text-muted-foreground">{detail.description}</p>

        <a
          href={`${apiBase}/r/${detail.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-cv-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-cv-primary-strong"
        >
          Activate offer at {detail.store?.name ?? "merchant"}
        </a>

        <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          {expires && (
            <div><span className="font-medium text-foreground">Expires:</span> {expires.toLocaleDateString()}</div>
          )}
          {detail.usedCount > 0 && (
            <div><span className="font-medium text-foreground">Used:</span> {detail.usedCount} times</div>
          )}
        </div>

        {detail.terms && (
          <section className="mt-6 rounded-md bg-muted/40 p-4">
            <h2 className="mb-1 text-sm font-semibold">Terms</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{detail.terms}</p>
          </section>
        )}
      </article>
    </div>
  );
}
