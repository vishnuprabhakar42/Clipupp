"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { tokenStore } from "@/lib/auth/token-store";
import { API_BASE } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiProblem } from "@/lib/api/types";

type ImportError = { line: number; slug: string | null; error: string };

type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
};

const REQUIRED = ["storeSlug", "type", "title", "description"];
const OPTIONAL = [
  "slug",
  "code",
  "savingsLabel",
  "expiresAt",
  "verified",
  "exclusive",
  "terms",
  "metaTitle",
  "metaDescription",
  "categorySlugs",
];

export function CouponImportWizard() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function readPreview(f: File) {
    const text = await f.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) {
      setPreview({ headers: [], rows: [] });
      return;
    }
    const parse = (line: string) => {
      // Cheap CSV parse for preview only — backend uses a stricter parser.
      const out: string[] = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQ) {
          if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
          else if (c === '"') inQ = false;
          else cur += c;
        } else if (c === '"') inQ = true;
        else if (c === ",") { out.push(cur); cur = ""; }
        else cur += c;
      }
      out.push(cur);
      return out;
    };
    const headers = parse(lines[0]);
    const rows = lines.slice(1, 11).map(parse);
    setPreview({ headers, rows });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    if (f) readPreview(f).catch(() => setPreview(null));
    else setPreview(null);
  }

  async function commit() {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const headers: Record<string, string> = { Accept: "application/json" };
      const tok = tokenStore.get();
      if (tok) headers.Authorization = `Bearer ${tok}`;
      const res = await fetch(`${API_BASE}/api/v1/admin/coupons/import`, {
        method: "POST",
        headers,
        credentials: "include",
        body: form,
      });
      if (!res.ok) {
        let problem: ApiProblem;
        try {
          problem = (await res.json()) as ApiProblem;
        } catch {
          problem = { title: res.statusText || "Import failed", status: res.status, code: "IMPORT_FAILED" };
        }
        throw new ApiError(problem);
      }
      const out = (await res.json()) as ImportResult;
      setResult(out);
      toast.success(`Created ${out.created} · updated ${out.updated} · ${out.errors.length} errors`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  const missingRequired = preview
    ? REQUIRED.filter((h) => !preview.headers.includes(h))
    : [];

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          1 · CSV format
        </h2>
        <p className="mt-2 text-sm">
          Upload a CSV with these columns. Existing rows are matched by{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">slug</code> and updated in place;
          new rows are created. <code className="rounded bg-muted px-1 font-mono text-xs">categorySlugs</code>{" "}
          accepts a pipe-separated list (e.g. <code className="font-mono text-xs">fashion|kids</code>).
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
          <div>
            <p className="font-semibold">Required</p>
            <ul className="mt-1 space-y-0.5 font-mono">
              {REQUIRED.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2">
            <p className="font-semibold">Optional</p>
            <ul className="mt-1 grid grid-cols-2 gap-x-4 font-mono">
              {OPTIONAL.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          2 · Choose file
        </h2>
        <Input
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          className="mt-3"
        />
        {file && (
          <p className="mt-2 text-xs text-muted-foreground">
            {file.name} · {(file.size / 1024).toFixed(1)} KB
          </p>
        )}
      </section>

      {preview && (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            3 · Preview (first 10 rows)
          </h2>
          {missingRequired.length > 0 && (
            <p className="mt-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              Missing required headers: {missingRequired.join(", ")}
            </p>
          )}
          <div className="mt-3 overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-left">
                <tr>
                  {preview.headers.map((h) => (
                    <th key={h} className="px-2 py-1.5 font-mono">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {preview.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((v, j) => (
                      <td key={j} className="px-2 py-1.5 line-clamp-1">
                        {v || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
                {preview.rows.length === 0 && (
                  <tr>
                    <td colSpan={preview.headers.length} className="px-2 py-3 text-center text-muted-foreground">
                      File contains only a header row.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="flex items-center gap-2 rounded-lg border bg-card p-5">
        <Button
          onClick={commit}
          disabled={!file || busy || missingRequired.length > 0}
        >
          {busy ? "Importing…" : "Commit import"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/coupons")}>
          Cancel
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          The whole file is processed in one transaction; errors are reported per-row.
        </span>
      </section>

      {result && (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Result
          </h2>
          <p className="mt-2 text-sm">
            <span className="font-semibold text-clipupp-success-strong">{result.created}</span> created ·{" "}
            <span className="font-semibold text-clipupp-primary-strong">{result.updated}</span> updated ·{" "}
            <span className="font-semibold text-clipupp-accent-strong">{result.skipped}</span> skipped ·{" "}
            <span className="font-semibold text-destructive">{result.errors.length}</span> errors
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-3 max-h-72 overflow-y-auto rounded-md border bg-muted/20 p-3 text-xs">
              {result.errors.map((e, i) => (
                <li key={i} className="font-mono">
                  line {e.line}
                  {e.slug && <> · {e.slug}</>} → {e.error}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
