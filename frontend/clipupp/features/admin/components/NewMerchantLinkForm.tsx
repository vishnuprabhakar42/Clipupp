"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  adminApi,
  type AdminMerchantLinkRow,
  type AdminNetworkRow,
} from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

type Mode = "create" | "edit";

export function MerchantLinkForm({
  mode = "create",
  initial,
  initialStoreId,
}: {
  mode?: Mode;
  initial?: AdminMerchantLinkRow;
  initialStoreId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [networks, setNetworks] = useState<AdminNetworkRow[]>([]);
  const [storeId, setStoreId] = useState(initial?.storeId ?? initialStoreId ?? "");
  const [networkId, setNetworkId] = useState(initial?.networkId ?? "");
  const [advertiserId, setAdvertiserId] = useState(initial?.advertiserId ?? "");
  const [template, setTemplate] = useState(
    initial?.deeplinkTemplate ??
      "https://example.com/click?u={merchantUrl}&sub_id={sub_id}&adv={advertiser_id}"
  );
  const [priority, setPriority] = useState<number>(initial?.priority ?? 0);
  const [active, setActive] = useState<boolean>(initial?.active ?? true);

  useEffect(() => {
    Promise.all([
      adminApi.listStores({ limit: 200 }),
      adminApi.listNetworks(),
    ])
      .then(([s, n]) => {
        setStores(s.data.map((x) => ({ id: x.id, name: x.name })));
        setNetworks(n);
        if (!networkId && n[0]) setNetworkId(n[0].id);
        if (!storeId && s.data[0]) setStoreId(s.data[0].id);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!storeId || !networkId || !advertiserId || !template) {
      toast.error("All required fields must be filled");
      return;
    }
    setBusy(true);
    try {
      if (mode === "edit" && initial) {
        await adminApi.updateMerchantLink(initial.id, {
          advertiserId,
          deeplinkTemplate: template,
          priority,
          active,
        });
        toast.success("Link saved");
      } else {
        await adminApi.createMerchantLink({
          storeId,
          networkId,
          advertiserId,
          deeplinkTemplate: template,
          priority,
          active,
        });
        toast.success("Link created");
      }
      router.push(`/admin/merchant-links?storeId=${storeId}`);
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not save link");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    if (!confirm("Delete this merchant link? This cannot be undone.")) return;
    setBusy(true);
    try {
      await adminApi.deleteMerchantLink(initial.id);
      toast.success("Link deleted");
      router.push(`/admin/merchant-links?storeId=${storeId}`);
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Delete failed");
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
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          disabled={mode === "edit"}
        >
          <option value="">Select…</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {mode === "edit" && (
          <p className="text-xs text-muted-foreground">Store/network can't be changed after creation.</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="networkId">
          Network<span className="ml-1 text-destructive">*</span>
        </Label>
        <select
          id="networkId"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={networkId}
          onChange={(e) => setNetworkId(e.target.value)}
          disabled={mode === "edit"}
        >
          <option value="">Select…</option>
          {networks.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name} ({n.code})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="advertiserId">
          Advertiser id<span className="ml-1 text-destructive">*</span>
        </Label>
        <Input
          id="advertiserId"
          value={advertiserId}
          onChange={(e) => setAdvertiserId(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="priority">Priority</Label>
        <Input
          id="priority"
          type="number"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="template">
          Deeplink template<span className="ml-1 text-destructive">*</span>
        </Label>
        <Textarea
          id="template"
          rows={3}
          className="font-mono text-xs"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Placeholders: {"{merchantUrl}, {sub_id}, {click_id}, {advertiser_id}, {network_code}"}
        </p>
      </div>
      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 sm:col-span-2">
        <div>
          <Label htmlFor="active">Active</Label>
          <p className="text-xs text-muted-foreground">
            Inactive links are skipped when resolving redirects.
          </p>
        </div>
        <Switch id="active" checked={active} onCheckedChange={setActive} />
      </div>
      <div className="sm:col-span-2 mt-2 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? (mode === "edit" ? "Saving…" : "Creating…") : mode === "edit" ? "Save changes" : "Create link"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/merchant-links")}
        >
          Cancel
        </Button>
        {mode === "edit" && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={busy}
            className="ml-auto"
          >
            Delete link
          </Button>
        )}
      </div>
    </form>
  );
}

/** Backwards-compatible create-form alias. */
export function NewMerchantLinkForm({ initialStoreId }: { initialStoreId?: string }) {
  return <MerchantLinkForm mode="create" initialStoreId={initialStoreId} />;
}
