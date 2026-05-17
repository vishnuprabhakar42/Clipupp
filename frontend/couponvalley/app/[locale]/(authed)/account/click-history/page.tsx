import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { API_BASE } from "@/lib/api/client";
import type { CursorPage } from "@/lib/api/types";
import type { ClickHistoryItem } from "@/lib/api/account";

export const metadata: Metadata = {
  title: "Click history",
  robots: { index: false },
};

type SearchParams = Promise<{ cursor?: string }>;

async function loadClicks(cursor: string | undefined): Promise<CursorPage<ClickHistoryItem> | null> {
  const cookieStore = await cookies();
  const rt = cookieStore.get("cv_rt");
  if (!rt) return null;

  // Server-side: refresh the access token using the user's HttpOnly cookie,
  // then call /api/v1/account/clicks with that fresh token. The same flow
  // backs getServerSession() in lib/auth/server.ts.
  const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { Cookie: `cv_rt=${rt.value}` },
    cache: "no-store",
  });
  if (!refreshRes.ok) return null;
  const { accessToken } = (await refreshRes.json()) as { accessToken: string };

  const usp = new URLSearchParams();
  if (cursor) usp.append("cursor", cursor);
  usp.append("limit", "25");

  const res = await fetch(`${API_BASE}/api/v1/account/clicks?${usp.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as CursorPage<ClickHistoryItem>;
}

export default async function ClickHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = await loadClicks(sp.cursor);

  if (!page) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold">Click history</h2>
        <p className="text-sm text-destructive">
          Could not load your click history. Please refresh the page.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-6">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">Click history</h2>
        <p className="text-sm text-muted-foreground">
          Every coupon you&apos;ve clicked through, in chronological order. Handy for finding
          a code you used yesterday.
        </p>
      </header>

      {page.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No clicks yet. Visit a store and click <em>Reveal code</em> or <em>Get this deal</em>.
        </p>
      ) : (
        <ul className="divide-y">
          {page.data.map((click) => (
            <li key={click.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium truncate">{new URL(click.outboundUrl).hostname}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(click.createdAt).toLocaleString()}
                </p>
              </div>
              <Link
                href={click.outboundUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-cv-primary hover:underline"
              >
                Reopen →
              </Link>
            </li>
          ))}
        </ul>
      )}

      {page.page.hasMore && page.page.nextCursor && (
        <div className="mt-4">
          <Link
            href={`/account/click-history?cursor=${encodeURIComponent(page.page.nextCursor)}`}
            className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Load more
          </Link>
        </div>
      )}
    </section>
  );
}
