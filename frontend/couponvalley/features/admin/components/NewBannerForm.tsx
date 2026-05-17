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
  type AdminBannerInput,
  type AdminBannerRow,
  type BannerPlacement,
} from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

type Mode = "create" | "edit";

type Props = {
  mode?: Mode;
  initial?: AdminBannerRow;
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}
function fromLocalInput(local: string): string | undefined {
  if (!local) return undefined;
  return /:\d{2}$/.test(local) ? `${local}Z` : `${local}:00Z`;
}

export function BannerForm({ mode = "create", initial }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<AdminBannerInput>(() =>
    initial
      ? {
          title: initial.title,
          subtitle: initial.subtitle ?? undefined,
          imageUrl: initial.imageUrl,
          linkUrl: initial.linkUrl,
          position: initial.position,
          startsAt: initial.startsAt ?? undefined,
          endsAt: initial.endsAt ?? undefined,
          active: initial.active,
          countryCode: initial.countryCode ?? undefined,
          placement: (initial.placement ?? "PROMO_CARD") as BannerPlacement,
        }
      : {
          title: "",
          imageUrl: "",
          linkUrl: "",
          position: 0,
          active: true,
          placement: "PROMO_CARD",
        }
  );

  function set<K extends keyof AdminBannerInput>(key: K, value: AdminBannerInput[K] | undefined) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!form.title || !form.imageUrl || !form.linkUrl) {
      toast.error("Title, image, and link URL are required");
      return;
    }
    setBusy(true);
    try {
      if (mode === "edit" && initial) {
        await adminApi.updateBanner(initial.id, form);
        toast.success("Banner updated");
      } else {
        await adminApi.createBanner(form);
        toast.success("Banner created");
      }
      router.push("/admin/banners");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not save banner");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    if (!confirm(`Delete "${initial.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await adminApi.deleteBanner(initial.id);
      toast.success("Banner deleted");
      router.push("/admin/banners");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <div className="max-w-[560px]">
          <ImageUploader
            label="Banner image"
            required
            aspect="wide"
            value={form.imageUrl}
            onChange={(url) => set("imageUrl", url ?? "")}
            hint="16:9 recommended for hero banners; 4:3 works for promo cards."
          />
        </div>
      </div>

      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="title">
          Title<span className="ml-1 text-destructive">*</span>
        </Label>
        <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Textarea
          id="subtitle"
          rows={2}
          value={form.subtitle ?? ""}
          onChange={(e) => set("subtitle", e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="linkUrl">
          Link URL<span className="ml-1 text-destructive">*</span>
        </Label>
        <Input
          id="linkUrl"
          type="url"
          value={form.linkUrl}
          onChange={(e) => set("linkUrl", e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="placement">Placement</Label>
        <select
          id="placement"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={form.placement ?? "PROMO_CARD"}
          onChange={(e) => set("placement", e.target.value as BannerPlacement)}
        >
          <option value="TOP_BAR">Top announcement bar</option>
          <option value="HERO_CAROUSEL">Hero carousel</option>
          <option value="PROMO_CARD">Promo card carousel</option>
        </select>
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
      <div className="space-y-1">
        <Label htmlFor="countryCode">Country code (optional, ISO 3166-1 alpha-2)</Label>
        <Input
          id="countryCode"
          maxLength={2}
          value={form.countryCode ?? ""}
          onChange={(e) => set("countryCode", e.target.value.toUpperCase() || undefined)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="startsAt">Starts at (optional)</Label>
        <Input
          id="startsAt"
          type="datetime-local"
          value={toLocalInput(form.startsAt)}
          onChange={(e) => set("startsAt", fromLocalInput(e.target.value))}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="endsAt">Ends at (optional)</Label>
        <Input
          id="endsAt"
          type="datetime-local"
          value={toLocalInput(form.endsAt)}
          onChange={(e) => set("endsAt", fromLocalInput(e.target.value))}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 sm:col-span-2">
        <div>
          <Label htmlFor="active">Active</Label>
          <p className="text-xs text-muted-foreground">
            Inactive banners are never shown, regardless of date window.
          </p>
        </div>
        <Switch
          id="active"
          checked={form.active ?? false}
          onCheckedChange={(v) => set("active", v)}
        />
      </div>

      <div className="sm:col-span-2 mt-2 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? (mode === "edit" ? "Saving…" : "Creating…") : mode === "edit" ? "Save changes" : "Create banner"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/banners")}>
          Cancel
        </Button>
        {mode === "edit" && initial && (
          <Button type="button" variant="destructive" className="ml-auto" onClick={onDelete} disabled={busy}>
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}

export function NewBannerForm() {
  return <BannerForm mode="create" />;
}
