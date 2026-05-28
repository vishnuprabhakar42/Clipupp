import type { Metadata } from "next";
import Link from "next/link";
import { API_BASE } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false },
};

type SearchParams = Promise<{ token?: string }>;

async function unsubscribe(token: string | undefined) {
  if (!token) return { ok: false };
  const res = await fetch(
    `${API_BASE}/api/v1/newsletter/unsubscribe?token=${encodeURIComponent(token)}`,
    { method: "GET", cache: "no-store" }
  );
  if (!res.ok) return { ok: false };
  const body = (await res.json()) as { state: string; email: string };
  return { ok: true, state: body.state, email: body.email };
}

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const result = await unsubscribe(sp.token);

  return (
    <div className="container max-w-xl py-16">
      <div className="rounded-md border bg-card p-8 text-center shadow-sm">
        {result.ok ? (
          <>
            <h1 className="mb-2 text-2xl font-semibold">
              {result.state === "UNSUBSCRIBED"
                ? "You're unsubscribed"
                : "Already off the list"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {result.email
                ? `${result.email} will not receive any more ClipUpp digests.`
                : "You won't receive any more ClipUpp digests."}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Changed your mind? Resubscribe anytime from the footer.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-semibold">Link is invalid</h1>
            <p className="text-sm text-muted-foreground">
              The unsubscribe link is missing or malformed. Email
              support@clipupp.com if you need help.
            </p>
          </>
        )}
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
