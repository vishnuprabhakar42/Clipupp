"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { MarkdownEditor } from "./MarkdownEditor";
import { adminApi, type AdminArticleRow, type AdminAuthorRow } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

type Mode = "create" | "edit";

type ArticleDetail = AdminArticleRow & {
  bodyMd: string;
  metaTitle: string | null;
  metaDescription: string | null;
};

type Props = {
  mode?: Mode;
  initial?: ArticleDetail;
};

type FormShape = {
  title: string;
  slug?: string;
  excerpt: string;
  bodyMd: string;
  authorId: string;
  heroImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
};

function fromLocalInput(local: string): string | undefined {
  if (!local) return undefined;
  return /:\d{2}$/.test(local) ? `${local}Z` : `${local}:00Z`;
}

export function ArticleForm({ mode = "create", initial }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [authors, setAuthors] = useState<AdminAuthorRow[]>([]);
  const [scheduleAt, setScheduleAt] = useState<string>("");
  const [form, setForm] = useState<FormShape>(() =>
    initial
      ? {
          title: initial.title,
          slug: initial.slug,
          excerpt: initial.excerpt,
          bodyMd: initial.bodyMd,
          authorId: initial.authorId,
          heroImageUrl: initial.heroImageUrl ?? undefined,
          metaTitle: initial.metaTitle ?? undefined,
          metaDescription: initial.metaDescription ?? undefined,
        }
      : { title: "", excerpt: "", bodyMd: "", authorId: "" }
  );

  useEffect(() => {
    adminApi
      .listAuthors()
      .then(setAuthors)
      .catch(() => undefined);
  }, []);

  function set<K extends keyof FormShape>(key: K, value: FormShape[K] | undefined) {
    setForm((f) => ({ ...f, [key]: value as FormShape[K] }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!form.title || !form.excerpt || !form.bodyMd) {
      toast.error("Title, excerpt, and body are required");
      return;
    }
    if (!form.authorId) {
      toast.error("Author is required");
      return;
    }
    setBusy(true);
    try {
      let saved: AdminArticleRow;
      if (mode === "edit" && initial) {
        saved = await adminApi.updateArticle(initial.id, form);
        toast.success("Article saved");
      } else {
        saved = await adminApi.createArticle(form);
        toast.success(`Created ${saved.slug}`);
        router.push(`/admin/blog/${saved.id}`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not save article");
    } finally {
      setBusy(false);
    }
  }

  async function transition(action: "PUBLISH" | "SCHEDULE" | "HIDE" | "DELETE") {
    if (!initial) return;
    if (action === "DELETE" && !confirm("Soft-delete this article?")) return;
    if (action === "SCHEDULE" && !scheduleAt) {
      toast.error("Pick a schedule time first");
      return;
    }
    setBusy(true);
    try {
      await adminApi.transitionArticle(initial.id, action, fromLocalInput(scheduleAt));
      toast.success(action.toLowerCase() + "d");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Action failed");
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
          <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slug">Slug (auto from title when blank)</Label>
          <Input id="slug" value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="authorId">
            Author<span className="ml-1 text-destructive">*</span>
          </Label>
          <select
            id="authorId"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={form.authorId}
            onChange={(e) => set("authorId", e.target.value)}
          >
            <option value="">Select an author…</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <ImageUploader
          label="Hero image"
          aspect="wide"
          value={form.heroImageUrl}
          onChange={(url) => set("heroImageUrl", url ?? undefined)}
          hint="16:9 preferred. Used as the OG image and the post header."
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="excerpt">
          Excerpt<span className="ml-1 text-destructive">*</span>
        </Label>
        <Textarea
          id="excerpt"
          rows={2}
          value={form.excerpt}
          maxLength={500}
          onChange={(e) => set("excerpt", e.target.value)}
        />
      </div>

      <MarkdownEditor
        value={form.bodyMd}
        onChange={(v) => set("bodyMd", v)}
        required
        rows={20}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="metaTitle">Meta title</Label>
          <Input
            id="metaTitle"
            maxLength={70}
            value={form.metaTitle ?? ""}
            onChange={(e) => set("metaTitle", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="metaDescription">Meta description</Label>
          <Input
            id="metaDescription"
            maxLength={170}
            value={form.metaDescription ?? ""}
            onChange={(e) => set("metaDescription", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : mode === "edit" ? "Save changes" : "Create draft"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/blog")}>
          Cancel
        </Button>

        {mode === "edit" && initial && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase">
              {initial.status}
            </span>
            {initial.status !== "PUBLISHED" && (
              <Button type="button" variant="default" onClick={() => transition("PUBLISH")} disabled={busy}>
                Publish now
              </Button>
            )}
            <Input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="w-44"
              aria-label="Schedule at"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => transition("SCHEDULE")}
              disabled={busy || !scheduleAt}
            >
              Schedule
            </Button>
            {initial.status !== "HIDDEN" && (
              <Button type="button" variant="outline" onClick={() => transition("HIDE")} disabled={busy}>
                Hide
              </Button>
            )}
            <Button type="button" variant="destructive" onClick={() => transition("DELETE")} disabled={busy}>
              Delete
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
