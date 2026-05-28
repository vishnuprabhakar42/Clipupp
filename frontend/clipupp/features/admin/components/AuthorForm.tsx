"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "./ImageUploader";
import { adminApi, type AdminAuthorRow } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

type Mode = "create" | "edit";

type FormShape = {
  name: string;
  slug?: string;
  bio?: string;
  avatarUrl?: string;
};

export function AuthorForm({
  mode = "create",
  initial,
}: {
  mode?: Mode;
  initial?: AdminAuthorRow;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormShape>(() =>
    initial
      ? {
          name: initial.name,
          slug: initial.slug,
          bio: initial.bio ?? undefined,
          avatarUrl: initial.avatarUrl ?? undefined,
        }
      : { name: "" }
  );

  function set<K extends keyof FormShape>(key: K, value: FormShape[K] | undefined) {
    setForm((f) => ({ ...f, [key]: value as FormShape[K] }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    setBusy(true);
    try {
      if (mode === "edit" && initial) {
        await adminApi.updateAuthor(initial.id, form);
        toast.success("Author saved");
      } else {
        await adminApi.createAuthor(form);
        toast.success(`Created ${form.name}`);
      }
      router.push("/admin/blog/authors");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not save author");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <ImageUploader
          label="Avatar"
          aspect="square"
          value={form.avatarUrl}
          onChange={(url) => set("avatarUrl", url ?? undefined)}
          hint="Square avatar (256×256 works well)."
        />
      </div>

      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="name">
          Name<span className="ml-1 text-destructive">*</span>
        </Label>
        <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="slug">Slug (auto from name when blank)</Label>
        <Input id="slug" value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={4}
          value={form.bio ?? ""}
          onChange={(e) => set("bio", e.target.value)}
        />
      </div>

      <div className="sm:col-span-2 mt-2 flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : mode === "edit" ? "Save changes" : "Create author"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/blog/authors")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
