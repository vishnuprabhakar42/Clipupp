import type { Metadata } from "next";
import Link from "next/link";
import { API_BASE } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Confirming subscription",
  robots: { index: false },
};

type SearchParams = Promise<{ token?: string }>;

async function confirm(token: string | undefined) {
  if (!token) return { ok: false, status: "MISSING" as const };
  const res = await fetch(
    `${API_BASE}/api/v1/newsletter/confirm?token=${encodeURIComponent(token)}`,
    { method: "GET", cache: "no-store" }
  );
  if (!res.ok) {
    return { ok: false, status: "INVALID" as const };
  }
  const body = (await res.json()) as { state: string; email: string };
  return { ok: true, status: body.state, email: body.email };
}

export default async function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const result = await confirm(sp.token);

  return (
    <div className="container max-w-xl py-16">
      <div className="rounded-md border bg-card p-8 text-center shadow-sm">
        {result.ok ? (
          <>
            <h1 className="mb-2 text-2xl font-semibold">You&apos;re subscribed</h1>
            <p className="text-sm text-muted-foreground">
              {result.email
                ? `${result.email} will get the next CouponValley digest.`
                : "Your email is confirmed."}
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-semibold">Confirmation link is invalid</h1>
            <p className="text-sm text-muted-foreground">
              The link is missing or already used. Resubscribe with your email below.
            </p>
          </>
        )}
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-md bg-cv-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-cv-primary-strong"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
