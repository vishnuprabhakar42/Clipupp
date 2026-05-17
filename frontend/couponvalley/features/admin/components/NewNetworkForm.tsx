"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adminApi, type AdminNetworkRow } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

type Mode = "create" | "edit";

export function NetworkForm({
  mode = "create",
  initial,
}: {
  mode?: Mode;
  initial?: AdminNetworkRow;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [secret, setSecret] = useState("");
  const [active, setActive] = useState(initial?.active ?? true);
  const [configJson, setConfigJson] = useState(initial?.configJson ?? "{}");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!code || !name) {
      toast.error("Code and name are required");
      return;
    }
    if (configJson) {
      try {
        JSON.parse(configJson);
      } catch {
        toast.error("Config is not valid JSON");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "edit" && initial) {
        await adminApi.updateNetwork(initial.id, {
          name,
          active,
          configJson: configJson || undefined,
          // Only send a new secret if the user actually typed one.
          postbackSecret: secret || undefined,
        });
        toast.success("Network saved");
      } else {
        await adminApi.createNetwork({
          code,
          name,
          postbackSecret: secret || undefined,
          active,
          configJson: configJson || undefined,
        });
        toast.success("Network created");
      }
      router.push("/admin/networks");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Could not save network");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="code">
          Code<span className="ml-1 text-destructive">*</span>
        </Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="impact"
          disabled={mode === "edit"}
        />
        {mode === "edit" && (
          <p className="text-xs text-muted-foreground">Code cannot be changed after creation.</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="name">
          Name<span className="ml-1 text-destructive">*</span>
        </Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="impact.com" />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="secret">
          Postback secret {mode === "edit" && initial?.hasSecret && "(set — leave blank to keep)"}
        </Label>
        <Input
          id="secret"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={mode === "edit" ? "Type a new secret to replace, or leave blank" : "Stored as bytes; can be overridden via env"}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="configJson">Config (JSON)</Label>
        <Textarea
          id="configJson"
          rows={4}
          className="font-mono text-xs"
          value={configJson}
          onChange={(e) => setConfigJson(e.target.value)}
          placeholder='{ "publisherId": "xxx" }'
        />
      </div>
      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 sm:col-span-2">
        <div>
          <Label htmlFor="active">Active</Label>
          <p className="text-xs text-muted-foreground">
            Inactive networks ignore postbacks and don&apos;t appear in merchant-link dropdowns.
          </p>
        </div>
        <Switch id="active" checked={active} onCheckedChange={setActive} />
      </div>
      <div className="sm:col-span-2 mt-2 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? (mode === "edit" ? "Saving…" : "Creating…") : mode === "edit" ? "Save changes" : "Create network"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/networks")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Backwards-compatible create-form alias. */
export function NewNetworkForm() {
  return <NetworkForm mode="create" />;
}
