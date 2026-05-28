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
  type AdminCouponCreate,
  type AdminCouponDetail,
  type AdminCouponUpdate,
  type CouponStatus,
  type CouponType,
} from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

type Mode = "create" | "edit";

type Props = {
  mode?: Mode;
  initial?: AdminCouponDetail;
};

type FormShape = AdminCouponCreate & { status?: CouponStatus };

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  // Strip seconds + timezone for the datetime-local widget.
  return iso.slice(0, 16);
}
function fromLocalInput(local: string): string | undefined {
  if (!local) return undefined;
  // Append :00Z so the backend gets a parseable OffsetDateTime.
  return /:\d{2}$/.test(local) ? `${local}Z` : `${local}:00Z`;
}

export function CouponForm({ mode = "create", initial }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [stores, setStores] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [form, setForm] = useState<Partial<FormShape>>(() =>
    initial
      ? {
          storeId: initial.storeId,
          slug: initial.slug,
          type: initial.type,
          code: initial.code ?? undefined,
          title: initial.title,
          description: initial.description,
          terms: initial.terms ?? undefined,
          savingsLabel: initial.savingsLabel ?? undefined,
          minPurchase: initial.minPurchase ? Number(initial.minPurchase) : undefined,
          minPurchaseCurrency: initial.minPurchaseCurrency ?? undefined,
          startsAt: initial.startsAt ?? undefined,
          expiresAt: initial.expiresAt ?? undefined,
          verified: initial.verified,
          exclusive: initial.exclusive,
          popularityScore: initial.popularityScore,
          affiliateUrlOverride: initial.affiliateUrlOverride ?? undefined,
          metaTitle: initial.metaTitle ?? undefined,
          metaDescription: initial.metaDescription ?? undefined,
          categorySlugs: initial.categorySlugs,
          status: initial.status,
        }
      : {
          type: "CODE",
          verified: true,
        }
  );

  useEffect(() => {
    adminApi
      .listAdminStores({ size: 200 })
      .then((p) => setStores(p.content.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))))
      .catch(() => undefined);
  }, []);

  function set<K extends keyof FormShape>(key: K, value: FormShape[K] | undefined) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const required = ["type", "title", "description"] as const;
      if (mode === "create" && !form.storeId) {
        toast.error("Store is required");
        setBusy(false);
        return;
      }
      for (const k of required) {
        if (!form[k]) {
          toast.error(`${k} is required`);
          setBusy(false);
          return;
        }
      }

      if (mode === "edit" && initial) {
        // Don't send storeId on update — the backend update DTO doesn't accept it.
        const { storeId: _omit, ...patch } = form as FormShape;
        await adminApi.updateCoupon(initial.id, patch as AdminCouponUpdate);
        toast.success("Coupon updated");
      } else {
        const created = await adminApi.createCoupon(form as AdminCouponCreate);
        toast.success(`Created ${created.slug}`);
      }
      router.push("/admin/coupons");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not save coupon");
    } finally {
      setBusy(false);
    }
  }

  async function onSoftDelete() {
    if (!initial) return;
    if (!confirm("Soft-delete this coupon? It can be restored later.")) return;
    setBusy(true);
    try {
      await adminApi.deleteCoupon(initial.id);
      toast.success("Coupon soft-deleted");
      router.push("/admin/coupons");
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
      await adminApi.restoreCoupon(initial.id);
      toast.success("Coupon restored");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Restore failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="storeId">
          Store<span className="ml-1 text-destructive">*</span>
        </Label>
        <select
          id="storeId"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={form.storeId ?? ""}
          onChange={(e) => set("storeId", e.target.value)}
          disabled={mode === "edit"}
        >
          <option value="">Select a store…</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {mode === "edit" && (
          <p className="text-xs text-muted-foreground">
            Store cannot be changed after a coupon is created. Create a new coupon instead.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="type">
          Type<span className="ml-1 text-destructive">*</span>
        </Label>
        <select
          id="type"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={form.type ?? "CODE"}
          onChange={(e) => set("type", e.target.value as CouponType)}
        >
          <option value="CODE">Code (paste at checkout)</option>
          <option value="DEAL">Deal (click-through)</option>
          <option value="FREE_SHIPPING">Free shipping</option>
          <option value="IN_STORE">In-store</option>
        </select>
      </div>

      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="title">
          Title<span className="ml-1 text-destructive">*</span>
        </Label>
        <Input id="title" value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="code">Code (CODE type only)</Label>
        <Input
          id="code"
          value={form.code ?? ""}
          onChange={(e) => set("code", e.target.value.toUpperCase())}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="savingsLabel">Savings label</Label>
        <Input
          id="savingsLabel"
          placeholder="20% off"
          value={form.savingsLabel ?? ""}
          onChange={(e) => set("savingsLabel", e.target.value)}
        />
      </div>

      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="description">
          Description<span className="ml-1 text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          rows={4}
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="terms">Terms</Label>
        <Textarea
          id="terms"
          rows={3}
          value={form.terms ?? ""}
          onChange={(e) => set("terms", e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="startsAt">Starts at</Label>
        <Input
          id="startsAt"
          type="datetime-local"
          value={toLocalInput(form.startsAt)}
          onChange={(e) => set("startsAt", fromLocalInput(e.target.value))}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="expiresAt">Expires at</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          value={toLocalInput(form.expiresAt)}
          onChange={(e) => set("expiresAt", fromLocalInput(e.target.value))}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="minPurchase">Min purchase</Label>
        <Input
          id="minPurchase"
          type="number"
          step="0.01"
          value={form.minPurchase ?? ""}
          onChange={(e) =>
            set("minPurchase", e.target.value === "" ? undefined : Number(e.target.value))
          }
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="minPurchaseCurrency">Min purchase currency (ISO 4217)</Label>
        <Input
          id="minPurchaseCurrency"
          maxLength={3}
          value={form.minPurchaseCurrency ?? ""}
          onChange={(e) =>
            set("minPurchaseCurrency", e.target.value.toUpperCase() || undefined)
          }
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="popularityScore">Popularity score</Label>
        <Input
          id="popularityScore"
          type="number"
          value={form.popularityScore ?? 0}
          onChange={(e) => set("popularityScore", Number(e.target.value))}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="affiliateUrlOverride">Override merchant URL (optional)</Label>
        <Input
          id="affiliateUrlOverride"
          type="url"
          value={form.affiliateUrlOverride ?? ""}
          onChange={(e) => set("affiliateUrlOverride", e.target.value)}
        />
      </div>

      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="categorySlugs">Category slugs (comma-separated)</Label>
        <Input
          id="categorySlugs"
          value={(form.categorySlugs ?? []).join(", ")}
          onChange={(e) =>
            set(
              "categorySlugs",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
        />
      </div>

      {mode === "edit" && (
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={form.status ?? "ACTIVE"}
            onChange={(e) => set("status", e.target.value as CouponStatus)}
          >
            <option value="ACTIVE">Active</option>
            <option value="HIDDEN">Hidden</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      )}

      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
        <Label htmlFor="verified">Verified</Label>
        <Switch
          id="verified"
          checked={form.verified ?? false}
          onCheckedChange={(v) => set("verified", v)}
        />
      </div>
      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
        <Label htmlFor="exclusive">Exclusive</Label>
        <Switch
          id="exclusive"
          checked={form.exclusive ?? false}
          onCheckedChange={(v) => set("exclusive", v)}
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
          {busy ? (mode === "edit" ? "Saving…" : "Creating…") : mode === "edit" ? "Save changes" : "Create coupon"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/coupons")}>
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

export function NewCouponForm() {
  return <CouponForm mode="create" />;
}
