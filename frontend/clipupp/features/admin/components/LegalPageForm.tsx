"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "./MarkdownEditor";
import { legalPagesApi, type LegalPageDetail } from "@/lib/api/legalPages";
import { isApiError } from "@/lib/api/errors";

export function LegalPageForm({ initial }: { initial: LegalPageDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: initial.title,
    bodyMd: initial.bodyMd,
    metaTitle: initial.metaTitle ?? "",
    metaDescription: initial.metaDescription ?? "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!form.title || !form.bodyMd) {
      toast.error("Title and body are required");
      return;
    }
    setBusy(true);
    try {
      await legalPagesApi.update(initial.slug, {
        title: form.title,
        bodyMd: form.bodyMd,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      });
      toast.success("Page saved");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not save page");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="title">
            Title<span className="ml-1 text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="metaTitle">Meta title</Label>
          <Input
            id="metaTitle"
            maxLength={70}
            value={form.metaTitle}
            onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="metaDescription">Meta description</Label>
          <Input
            id="metaDescription"
            maxLength={200}
            value={form.metaDescription}
            onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
          />
        </div>
      </div>

      <MarkdownEditor
        value={form.bodyMd}
        onChange={(v) => setForm((f) => ({ ...f, bodyMd: v }))}
        required
        rows={24}
      />

      <div className="flex items-center gap-3 border-t pt-4">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/legal-pages")}>
          Cancel
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          Slug <code className="rounded bg-muted px-1 font-mono">{initial.slug}</code> is fixed
        </span>
      </div>
    </form>
  );
}
