"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  adminApi,
  type AdminCategoryCreate,
  type AdminCategoryDetail,
  type AdminCategoryUpdate,
} from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

type Mode = "create" | "edit";

type Props = {
  mode?: Mode;
  initial?: AdminCategoryDetail;
};

type FormShape = AdminCategoryCreate & { active?: boolean };

export function CategoryForm({ mode = "create", initial }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [parents, setParents] = useState<Array<{ id: string; title: string }>>([]);
  const [form, setForm] = useState<Partial<FormShape>>(() =>
    initial
      ? {
          title: initial.title,
          slug: initial.slug,
          parentId: initial.parentId ?? undefined,
          icon: initial.icon ?? undefined,
          description: initial.description ?? undefined,
          position: initial.position,
          metaTitle: initial.metaTitle ?? undefined,
          metaDescription: initial.metaDescription ?? undefined,
          active: initial.active,
        }
      : { active: true }
  );

  useEffect(() => {
    adminApi
      .listAdminCategories()
      .then((all) =>
        setParents(
          all
            .filter((c) => !initial || c.id !== initial.id)
            .map((c) => ({ id: c.id, title: c.title }))
        )
      )
      .catch(() => undefined);
  }, [initial]);

  function set<K extends keyof FormShape>(key: K, value: FormShape[K] | undefined) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (!form.title) {
        toast.error("Title is required");
        setBusy(false);
        return;
      }

      if (mode === "edit" && initial) {
        const update: AdminCategoryUpdate = { ...form };
        await adminApi.updateCategory(initial.id, update);
        toast.success("Category updated");
      } else {
        const created = await adminApi.createCategory(form as AdminCategoryCreate);
        toast.success(`Created ${created.slug}`);
      }
      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not save category");
    } finally {
      setBusy(false);
    }
  }

  async function onDeactivate() {
    if (!initial) return;
    if (!confirm(`Deactivate "${initial.title}"?`)) return;
    setBusy(true);
    try {
      await adminApi.deactivateCategory(initial.id);
      toast.success("Category deactivated");
      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Deactivate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="title">
          Title<span className="ml-1 text-destructive">*</span>
        </Label>
        <Input id="title" value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="parentId">Parent category</Label>
        <select
          id="parentId"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={form.parentId ?? ""}
          onChange={(e) => set("parentId", e.target.value || undefined)}
        >
          <option value="">(top-level)</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="icon">Icon (lucide name, optional)</Label>
        <Input id="icon" value={form.icon ?? ""} onChange={(e) => set("icon", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="position">Position</Label>
        <Input
          id="position"
          type="number"
          value={form.position ?? 0}
          onChange={(e) => set("position", Number(e.target.value))}
        />
      </div>
      {mode === "edit" && (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 sm:col-span-2">
          <div>
            <Label htmlFor="active">Active</Label>
            <p className="text-xs text-muted-foreground">
              Inactive categories are hidden from the public site.
            </p>
          </div>
          <Switch
            id="active"
            checked={form.active ?? false}
            onCheckedChange={(v) => set("active", v)}
          />
        </div>
      )}
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="metaTitle">Meta title</Label>
        <Input
          id="metaTitle"
          maxLength={70}
          value={form.metaTitle ?? ""}
          onChange={(e) => set("metaTitle", e.target.value)}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="metaDescription">Meta description</Label>
        <Input
          id="metaDescription"
          maxLength={170}
          value={form.metaDescription ?? ""}
          onChange={(e) => set("metaDescription", e.target.value)}
        />
      </div>
      <div className="sm:col-span-2 mt-2 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? (mode === "edit" ? "Saving…" : "Creating…") : mode === "edit" ? "Save changes" : "Create category"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/categories")}>
          Cancel
        </Button>
        {mode === "edit" && initial && initial.active && (
          <Button type="button" variant="destructive" className="ml-auto" onClick={onDeactivate} disabled={busy}>
            Deactivate
          </Button>
        )}
      </div>
    </form>
  );
}

export function NewCategoryForm() {
  return <CategoryForm mode="create" />;
}
