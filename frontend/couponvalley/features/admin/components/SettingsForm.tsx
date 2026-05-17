"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { settingsApi, asString } from "@/lib/api/settings";
import { isApiError } from "@/lib/api/errors";
import { ImageUploader } from "./ImageUploader";

export type SettingFieldType = "text" | "textarea" | "url" | "color" | "image";

export type SettingFieldDef = {
  key: string;
  label: string;
  hint?: string;
  type?: SettingFieldType;
  placeholder?: string;
};

/**
 * Generic key/value editor used by every settings page. Each form is bound
 * to a list of field definitions and the current values from the backend;
 * on submit it bulk-PATCHes only the keys that actually changed.
 */
export function SettingsForm({
  fields,
  initial,
}: {
  fields: SettingFieldDef[];
  initial: Record<string, unknown>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const start: Record<string, string> = {};
    for (const f of fields) start[f.key] = asString(initial[f.key]);
    return start;
  });
  const [busy, setBusy] = useState(false);

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    // Diff against the original so we don't bump updated_at on untouched rows.
    const changes: Record<string, string> = {};
    for (const f of fields) {
      const orig = asString(initial[f.key]);
      if (values[f.key] !== orig) changes[f.key] = values[f.key];
    }
    if (Object.keys(changes).length === 0) {
      toast.info("Nothing to save");
      return;
    }
    setBusy(true);
    try {
      await settingsApi.bulkSet(changes);
      toast.success(`Saved ${Object.keys(changes).length} setting(s)`);
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <Label htmlFor={f.key} className="flex items-center justify-between text-sm">
            <span>{f.label}</span>
            <code className="text-[10px] font-mono text-muted-foreground">{f.key}</code>
          </Label>
          {f.type === "textarea" ? (
            <Textarea
              id={f.key}
              rows={3}
              value={values[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => set(f.key, e.target.value)}
            />
          ) : f.type === "color" ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(values[f.key]) ? values[f.key] : "var(--cv-primary)"}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border bg-background"
              />
              <Input
                id={f.key}
                value={values[f.key]}
                placeholder={f.placeholder ?? "var(--cv-primary)"}
                onChange={(e) => set(f.key, e.target.value)}
              />
            </div>
          ) : f.type === "image" ? (
            <ImageUploader
              value={values[f.key]}
              onChange={(url) => set(f.key, url ?? "")}
              aspect="wide"
              hint={f.hint}
            />
          ) : (
            <Input
              id={f.key}
              type={f.type === "url" ? "url" : "text"}
              value={values[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => set(f.key, e.target.value)}
            />
          )}
          {f.hint && f.type !== "image" && (
            <p className="text-xs text-muted-foreground">{f.hint}</p>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2 border-t pt-4">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
