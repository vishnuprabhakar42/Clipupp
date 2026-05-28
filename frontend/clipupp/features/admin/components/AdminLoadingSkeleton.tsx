/**
 * Tiny reusable skeleton variants for admin server-component routes.
 * Each shape mirrors the layout of the page it backs so navigation feels
 * instant even on a cold server-side fetch.
 */

function HeaderSkel() {
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-muted/50" />
        <div className="h-3 w-72 animate-pulse rounded bg-muted/30" />
      </div>
      <div className="h-9 w-28 animate-pulse rounded bg-muted/40" />
    </header>
  );
}

export function AdminTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div>
      <HeaderSkel />
      <div className="rounded-lg border bg-card">
        <div className="border-b bg-muted/30 px-4 py-2">
          <div className="h-3 w-40 animate-pulse rounded bg-muted/50" />
        </div>
        <ul className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-4 w-4 animate-pulse rounded bg-muted/40" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-muted/40" />
              <div className="h-4 w-1/6 animate-pulse rounded bg-muted/30" />
              <div className="h-4 w-1/12 animate-pulse rounded bg-muted/30" />
              <div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted/30" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AdminGridSkeleton({ tiles = 8 }: { tiles?: number }) {
  return (
    <div>
      <HeaderSkel />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: tiles }).map((_, i) => (
          <li key={i} className="h-28 rounded-lg border bg-card">
            <div className="h-full w-full animate-pulse rounded-lg bg-muted/30" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminFormSkeleton() {
  return (
    <div>
      <HeaderSkel />
      <div className="space-y-4 rounded-lg border bg-card p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
            <div className="h-9 w-full animate-pulse rounded bg-muted/30" />
          </div>
        ))}
        <div className="h-9 w-32 animate-pulse rounded bg-muted/40" />
      </div>
    </div>
  );
}
