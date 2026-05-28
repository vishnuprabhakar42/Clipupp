"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Dynamic-import the markdown renderer so the heavy parser only loads when
// the admin opens an editor — keeps the rest of the admin shell snappy.
const MarkdownView = dynamic(() => import("./MarkdownView").then((m) => m.MarkdownView), {
  ssr: false,
  loading: () => <div className="text-sm text-muted-foreground">Loading preview…</div>,
});

type Tab = "write" | "preview" | "split";

export function MarkdownEditor({
  value,
  onChange,
  label = "Body (Markdown)",
  rows = 18,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  rows?: number;
  required?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("split");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        <div className="inline-flex overflow-hidden rounded-md border bg-background text-xs">
          {(["write", "split", "preview"] as Tab[]).map((t) => (
            <Button
              key={t}
              type="button"
              variant={tab === t ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-none"
              onClick={() => setTab(t)}
            >
              {t === "split" ? "Split" : t === "write" ? "Write" : "Preview"}
            </Button>
          ))}
        </div>
      </div>
      <div
        className={
          tab === "split"
            ? "grid gap-3 md:grid-cols-2"
            : "grid gap-3 md:grid-cols-1"
        }
      >
        {(tab === "write" || tab === "split") && (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            spellCheck
            className="font-mono text-sm"
          />
        )}
        {(tab === "preview" || tab === "split") && (
          <div className="prose prose-slate max-w-none rounded-md border bg-muted/30 p-4 text-sm dark:prose-invert">
            {value.trim() ? <MarkdownView source={value} /> : (
              <p className="text-muted-foreground italic">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
