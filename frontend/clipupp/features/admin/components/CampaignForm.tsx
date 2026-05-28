"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "./ImageUploader";
import {
  campaignsApi,
  type CampaignCreate,
  type CampaignDetail,
  type CampaignUpdate,
} from "@/lib/api/campaigns";
import { adminApi } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

type Mode = "create" | "edit";

type FormShape = CampaignCreate;

function toLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}
function fromLocal(local: string): string | undefined {
  if (!local) return undefined;
  return /:\d{2}$/.test(local) ? `${local}Z` : `${local}:00Z`;
}

export function CampaignForm({ mode = "create", initial }: { mode?: Mode; initial?: CampaignDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [storeOpts, setStoreOpts] = useState<Array<{ id: string; name: string }>>([]);
  const [couponOpts, setCouponOpts] = useState<Array<{ id: string; title: string }>>([]);
  const [form, setForm] = useState<FormShape>(() =>
    initial
      ? {
          name: initial.name,
          slug: initial.slug,
          description: initial.description ?? undefined,
          startsAt: initial.startsAt,
          endsAt: initial.endsAt,
          active: initial.active,
          heroTitle: initial.heroTitle ?? undefined,
          heroSubtitle: initial.heroSubtitle ?? undefined,
          heroImageUrl: initial.heroImageUrl ?? undefined,
          ctaLabel: initial.ctaLabel ?? undefined,
          ctaUrl: initial.ctaUrl ?? undefined,
          themeColor: initial.themeColor ?? undefined,
          bannerId: initial.bannerId ?? undefined,
          pinnedStoreIds: initial.pinnedStoreIds,
          pinnedCouponIds: initial.pinnedCouponIds,
        }
      : {
          name: "",
          startsAt: "",
          endsAt: "",
          active: true,
          pinnedStoreIds: [],
          pinnedCouponIds: [],
        }
  );

  useEffect(() => {
    adminApi
      .listAdminStores({ size: 200 })
      .then((p) => setStoreOpts(p.content.map((s) => ({ id: s.id, name: s.name }))))
      .catch(() => undefined);
    adminApi
      .listAdminCoupons({ size: 200 })
      .then((p) => setCouponOpts(p.content.map((c) => ({ id: c.id, title: c.title }))))
      .catch(() => undefined);
  }, []);

  function set<K extends keyof FormShape>(key: K, value: FormShape[K] | undefined) {
    setForm((f) => ({ ...f, [key]: value as FormShape[K] }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!form.name || !form.startsAt || !form.endsAt) {
      toast.error("Name, starts-at, and ends-at are required");
      return;
    }
    setBusy(true);
    try {
      if (mode === "edit" && initial) {
        const patch: CampaignUpdate = { ...form };
        await campaignsApi.update(initial.id, patch);
        toast.success("Campaign saved");
      } else {
        const created = await campaignsApi.create(form);
        toast.success("Campaign created");
        router.push(`/admin/campaigns/${created.id}`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onActivate() {
    if (!initial) return;
    setBusy(true);
    try {
      await campaignsApi.activate(initial.id);
      toast.success("Activated");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Activate failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    if (!confirm(`Delete campaign "${initial.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await campaignsApi.delete(initial.id);
      toast.success("Campaign deleted");
      router.push("/admin/campaigns");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="name">
            Name<span className="ml-1 text-destructive">*</span>
          </Label>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slug">Slug (auto from name when blank)</Label>
          <Input id="slug" value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
        </div>
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <Label htmlFor="active">Active</Label>
          <Switch id="active" checked={form.active ?? false} onCheckedChange={(v) => set("active", v)} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="description">Internal description</Label>
          <Textarea
            id="description"
            rows={2}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="startsAt">
            Starts at<span className="ml-1 text-destructive">*</span>
          </Label>
          <Input
            id="startsAt"
            type="datetime-local"
            value={toLocal(form.startsAt)}
            onChange={(e) => set("startsAt", fromLocal(e.target.value) ?? "")}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endsAt">
            Ends at<span className="ml-1 text-destructive">*</span>
          </Label>
          <Input
            id="endsAt"
            type="datetime-local"
            value={toLocal(form.endsAt)}
            onChange={(e) => set("endsAt", fromLocal(e.target.value) ?? "")}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Hero overlay
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="heroTitle">Hero title</Label>
            <Input
              id="heroTitle"
              value={form.heroTitle ?? ""}
              onChange={(e) => set("heroTitle", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="heroSubtitle">Hero subtitle</Label>
            <Input
              id="heroSubtitle"
              value={form.heroSubtitle ?? ""}
              onChange={(e) => set("heroSubtitle", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ctaLabel">CTA label</Label>
            <Input
              id="ctaLabel"
              value={form.ctaLabel ?? ""}
              onChange={(e) => set("ctaLabel", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ctaUrl">CTA URL</Label>
            <Input
              id="ctaUrl"
              type="url"
              value={form.ctaUrl ?? ""}
              onChange={(e) => set("ctaUrl", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="themeColor">Theme color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  form.themeColor && /^#[0-9A-Fa-f]{6}$/.test(form.themeColor)
                    ? form.themeColor
                    : "var(--clipupp-primary)"
                }
                onChange={(e) => set("themeColor", e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border bg-background"
              />
              <Input
                id="themeColor"
                value={form.themeColor ?? ""}
                placeholder="var(--clipupp-primary)"
                onChange={(e) => set("themeColor", e.target.value)}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <ImageUploader
              label="Hero image"
              aspect="wide"
              value={form.heroImageUrl}
              onChange={(url) => set("heroImageUrl", url ?? undefined)}
              hint="16:9 recommended."
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Pinned content (overrides homepage defaults during the run)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <MultiSelect
            label="Pinned stores"
            value={form.pinnedStoreIds ?? []}
            options={storeOpts.map((s) => ({ id: s.id, label: s.name }))}
            onChange={(v) => set("pinnedStoreIds", v)}
          />
          <MultiSelect
            label="Pinned coupons"
            value={form.pinnedCouponIds ?? []}
            options={couponOpts.map((c) => ({ id: c.id, label: c.title }))}
            onChange={(v) => set("pinnedCouponIds", v)}
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : mode === "edit" ? "Save changes" : "Create campaign"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/campaigns")}>
          Cancel
        </Button>
        {mode === "edit" && initial && (
          <div className="ml-auto flex items-center gap-2">
            {!initial.active && (
              <Button type="button" variant="default" onClick={onActivate} disabled={busy}>
                Activate
              </Button>
            )}
            <Button type="button" variant="destructive" onClick={onDelete} disabled={busy}>
              Delete
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}

/** Tiny multi-select with chips. Avoids pulling in a heavier combo widget. */
function MultiSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string[];
  options: { id: string; label: string }[];
  onChange: (next: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const selected = new Set(value);
  const filtered = options
    .filter((o) => !selected.has(o.id))
    .filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 30);
  const labelById = new Map(options.map((o) => [o.id, o.label]));
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 rounded-md border bg-card p-2">
        <ul className="flex flex-wrap gap-1">
          {value.map((id) => (
            <li
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
            >
              <span className="line-clamp-1">{labelById.get(id) ?? id}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== id))}
                aria-label="remove"
                className="hover:opacity-80"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <Input
          className="mt-2"
          placeholder="Search to add…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <ul className="mt-2 max-h-40 overflow-y-auto rounded-md border">
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  className="w-full px-2 py-1 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onChange([...value, o.id]);
                    setQ("");
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-2 py-1 text-xs text-muted-foreground">No matches.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
