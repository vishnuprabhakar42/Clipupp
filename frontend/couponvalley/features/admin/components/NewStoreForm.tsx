"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "./ImageUploader";
import {
  adminApi,
  type AdminStoreCreate,
  type AdminStoreDetail,
  type AdminStoreUpdate,
  type StoreStatus,
} from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

type Mode = "create" | "edit";

type FormShape = AdminStoreCreate & {
  status?: StoreStatus;
};

type Props = {
  mode?: Mode;
  initial?: AdminStoreDetail;
};

export function StoreForm({ mode = "create", initial }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Partial<FormShape>>(() =>
    initial
      ? {
          name: initial.name,
          slug: initial.slug,
          logoUrl: initial.logoUrl,
          description: initial.description,
          shortDescription: initial.shortDescription ?? undefined,
          rating: initial.rating ? Number(initial.rating) : undefined,
          reviewCount: initial.reviewCount,
          phone: initial.phone ?? undefined,
          address: initial.address ?? undefined,
          primaryUrl: initial.primaryUrl,
          countryCode: initial.countryCode,
          popularityScore: initial.popularityScore,
          brandColor: initial.brandColor ?? undefined,
          cashbackRate: initial.cashbackRate ?? undefined,
          previousCashbackRate: initial.previousCashbackRate ?? undefined,
          tagline: initial.tagline ?? undefined,
          featured: initial.featured,
          metaTitle: initial.metaTitle ?? undefined,
          metaDescription: initial.metaDescription ?? undefined,
          topOffers: initial.topOffers,
          status: initial.status,
        }
      : {
          countryCode: "IN",
          popularityScore: 0,
          featured: false,
        }
  );

  function set<K extends keyof FormShape>(key: K, value: FormShape[K] | undefined) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const required = ["name", "logoUrl", "description", "primaryUrl", "countryCode"] as const;
      for (const k of required) {
        if (!form[k]) {
          toast.error(`${k} is required`);
          setBusy(false);
          return;
        }
      }

      if (mode === "edit" && initial) {
        const update: AdminStoreUpdate = { ...form };
        await adminApi.updateStore(initial.id, update);
        toast.success("Store updated");
      } else {
        const created = await adminApi.createStore(form as AdminStoreCreate);
        toast.success(`Created ${created.name}`);
      }
      router.push("/admin/stores");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not save store");
    } finally {
      setBusy(false);
    }
  }

  async function onSoftDelete() {
    if (!initial) return;
    if (!confirm(`Soft-delete ${initial.name}? It can be restored later.`)) return;
    setBusy(true);
    try {
      await adminApi.deleteStore(initial.id);
      toast.success("Store soft-deleted");
      router.push("/admin/stores");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    if (!initial) return;
    setBusy(true);
    try {
      await adminApi.restoreStore(initial.id);
      toast.success("Store restored");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Restore failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        {/* Cap the uploader width so a small logo doesn't render as a giant
            square preview on wide forms. */}
        <div className="max-w-[220px]">
          <ImageUploader
            label="Logo"
            required
            aspect="square"
            value={form.logoUrl}
            onChange={(url) => set("logoUrl", url ?? undefined)}
            hint="Square logo recommended (512×512). PNG with transparent background works best."
          />
        </div>
      </div>

      <Field id="name" label="Name" required>
        <Input id="name" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field id="slug" label="Slug (auto from name when blank)">
        <Input id="slug" value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} />
      </Field>

      <Field id="primaryUrl" label="Merchant landing URL" required>
        <Input
          id="primaryUrl"
          type="url"
          value={form.primaryUrl ?? ""}
          onChange={(e) => set("primaryUrl", e.target.value)}
        />
      </Field>
      <Field id="countryCode" label="Country (ISO 3166-1 alpha-2)" required>
        <Input
          id="countryCode"
          maxLength={2}
          value={form.countryCode ?? ""}
          onChange={(e) => set("countryCode", e.target.value.toUpperCase())}
        />
      </Field>

      <Field id="brandColor" label="Brand color (#RRGGBB)">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.brandColor && /^#[0-9A-Fa-f]{6}$/.test(form.brandColor) ? form.brandColor : "var(--cv-primary)"}
            onChange={(e) => set("brandColor", e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border bg-background"
          />
          <Input
            id="brandColor"
            value={form.brandColor ?? ""}
            placeholder="var(--cv-primary)"
            onChange={(e) => set("brandColor", e.target.value)}
          />
        </div>
      </Field>
      <Field id="tagline" label="Tagline (≤120 chars)">
        <Input
          id="tagline"
          maxLength={120}
          value={form.tagline ?? ""}
          onChange={(e) => set("tagline", e.target.value)}
        />
      </Field>

      <Field id="cashbackRate" label="Deal label (e.g. 'Up to 50% off', '₹200 off ₹999')">
        <Input
          id="cashbackRate"
          maxLength={40}
          value={form.cashbackRate ?? ""}
          onChange={(e) => set("cashbackRate", e.target.value)}
        />
      </Field>
      <Field id="previousCashbackRate" label="Previous deal label (renders the 'was X' badge)">
        <Input
          id="previousCashbackRate"
          maxLength={40}
          value={form.previousCashbackRate ?? ""}
          onChange={(e) => set("previousCashbackRate", e.target.value)}
        />
      </Field>

      <Field id="popularityScore" label="Popularity score">
        <Input
          id="popularityScore"
          type="number"
          value={form.popularityScore ?? 0}
          onChange={(e) => set("popularityScore", Number(e.target.value))}
        />
      </Field>
      <Field id="rating" label="Rating (0–5)">
        <Input
          id="rating"
          type="number"
          step="0.1"
          min={0}
          max={5}
          value={form.rating ?? ""}
          onChange={(e) =>
            set("rating", e.target.value === "" ? undefined : Number(e.target.value))
          }
        />
      </Field>

      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 sm:col-span-2">
        <div>
          <Label htmlFor="featured">Featured store</Label>
          <p className="text-xs text-muted-foreground">
            Surfaces this store on the homepage featured-stores grid.
          </p>
        </div>
        <Switch
          id="featured"
          checked={form.featured ?? false}
          onCheckedChange={(v) => set("featured", v)}
        />
      </div>

      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="shortDescription">Short description (≤280 chars)</Label>
        <Input
          id="shortDescription"
          maxLength={280}
          value={form.shortDescription ?? ""}
          onChange={(e) => set("shortDescription", e.target.value)}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="description">
          Description<span className="ml-1 text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          rows={6}
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="metaTitle">Meta title (≤70)</Label>
        <Input
          id="metaTitle"
          maxLength={70}
          value={form.metaTitle ?? ""}
          onChange={(e) => set("metaTitle", e.target.value)}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="metaDescription">Meta description (≤170)</Label>
        <Input
          id="metaDescription"
          maxLength={170}
          value={form.metaDescription ?? ""}
          onChange={(e) => set("metaDescription", e.target.value)}
        />
      </div>

      <div className="sm:col-span-2 mt-2 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? (mode === "edit" ? "Saving…" : "Creating…") : mode === "edit" ? "Save changes" : "Create store"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/stores")}>
          Cancel
        </Button>
        {mode === "edit" && initial && (
          <div className="ml-auto flex items-center gap-2">
            {initial.deletedAt ? (
              <Button type="button" variant="secondary" onClick={onRestore} disabled={busy}>
                Restore
              </Button>
            ) : (
              <Button type="button" variant="destructive" onClick={onSoftDelete} disabled={busy}>
                Soft-delete
              </Button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

/** Backwards-compatible default-create form used by /admin/stores/new. */
export function NewStoreForm() {
  return <StoreForm mode="create" />;
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
