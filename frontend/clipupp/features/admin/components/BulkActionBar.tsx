"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/errors";

type Action<A extends string> = {
  value: A;
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  confirm?: string;
};

type Props<A extends string> = {
  actions: Action<A>[];
  selector: string; // CSS selector for the row checkboxes (data-bulk-id)
  run: (action: A, ids: string[]) => Promise<{ matched: number; updated: number }>;
  /** Optional URL to navigate to a CSV importer for the same entity. */
  importHref?: string;
};

/**
 * A floating selection bar that hooks into checkboxes rendered in a
 * server-component list page. The bar mounts as a sibling of the list and
 * subscribes to clicks on `<input type="checkbox" data-bulk-id="...">` so
 * server-rendered tables don't need to become client components.
 */
export function BulkActionBar<A extends string>({ actions, selector, run, importHref }: Props<A>) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const headerCbRef = useRef<HTMLInputElement | null>(null);

  // Subscribe to all matching checkboxes on the page.
  useEffect(() => {
    const handler = (e: Event) => {
      const t = e.target as HTMLInputElement | null;
      if (!t || !t.matches(selector)) return;
      const id = t.getAttribute("data-bulk-id");
      if (!id) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (t.checked) next.add(id);
        else next.delete(id);
        return next;
      });
    };
    document.addEventListener("change", handler, true);
    return () => document.removeEventListener("change", handler, true);
  }, [selector]);

  // Header checkbox toggles all rows currently in the DOM.
  function toggleAll(check: boolean) {
    const boxes = Array.from(
      document.querySelectorAll<HTMLInputElement>(selector)
    );
    setSelected(() => {
      const next = new Set<string>();
      for (const b of boxes) {
        b.checked = check;
        const id = b.getAttribute("data-bulk-id");
        if (check && id) next.add(id);
      }
      return next;
    });
  }

  function clear() {
    document
      .querySelectorAll<HTMLInputElement>(selector)
      .forEach((b) => (b.checked = false));
    setSelected(new Set());
  }

  async function trigger(action: Action<A>) {
    if (selected.size === 0) return;
    if (action.confirm && !confirm(action.confirm.replace("{n}", String(selected.size)))) return;
    setBusy(true);
    try {
      const res = await run(action.value, Array.from(selected));
      toast.success(`${action.label}: ${res.updated}/${res.matched} updated`);
      clear();
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Bulk action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-sm">
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          ref={headerCbRef}
          type="checkbox"
          onChange={(e) => toggleAll(e.target.checked)}
          className="h-4 w-4 rounded border"
        />
        <span className="font-medium">{selected.size} selected</span>
      </label>
      <span className="text-xs text-muted-foreground">
        Tip: select rows below and pick an action.
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {importHref && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => router.push(importHref)}
          >
            Import CSV
          </Button>
        )}
        {actions.map((a) => (
          <Button
            key={a.value}
            type="button"
            size="sm"
            variant={a.variant ?? "secondary"}
            disabled={busy || selected.size === 0}
            onClick={() => trigger(a)}
          >
            {a.label}
          </Button>
        ))}
        {selected.size > 0 && (
          <Button type="button" size="sm" variant="ghost" onClick={clear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
