"use client";

import { useCallback, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { mediaApi } from "@/lib/api/media";
import { isApiError } from "@/lib/api/errors";

const ACCEPTED = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — matches backend limit

type Props = {
  value: string | undefined | null;
  onChange: (url: string | null) => void;
  label?: string;
  required?: boolean;
  /** Aspect ratio applied to the preview ("square" | "wide" | "tall"). */
  aspect?: "square" | "wide" | "tall";
  /** Optional helper text shown below the picker. */
  hint?: string;
  disabled?: boolean;
};

/**
 * Reusable image uploader: drag-and-drop or click to choose, uploads via
 * /api/v1/media/upload (R2 in prod, placeholder in dev), shows live preview,
 * supports manual URL entry as a fallback, and replace/remove.
 */
export function ImageUploader({
  value,
  onChange,
  label,
  required,
  aspect = "square",
  hint,
  disabled,
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const aspectClass =
    aspect === "wide" ? "aspect-[16/9]" : aspect === "tall" ? "aspect-[3/4]" : "aspect-square";

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!ACCEPTED.split(",").includes(file.type)) {
        toast.error("Unsupported image type");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("File is too large (max 10 MB)");
        return;
      }
      setBusy(true);
      setProgress(15);
      try {
        // Show some visual progress even though fetch doesn't expose upload progress.
        const tick = window.setInterval(() => {
          setProgress((p) => (p < 85 ? p + 7 : p));
        }, 120);
        const { url } = await mediaApi.upload(file);
        window.clearInterval(tick);
        setProgress(100);
        onChange(url);
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(isApiError(err) ? err.message : "Upload failed");
      } finally {
        setBusy(false);
        setTimeout(() => setProgress(0), 400);
      }
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}

      <div
        className={`group relative flex flex-col items-stretch gap-3 rounded-md border border-dashed bg-muted/40 p-3 transition ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!busy) handleFiles(e.dataTransfer.files);
        }}
      >
        <div className={`relative w-full overflow-hidden rounded-sm bg-background ${aspectClass}`}>
          {value ? (
            // Use a plain <img> (not next/image) so unconfigured external R2/dev
            // domains render without next.config.mjs allow-list churn.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="preview"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <span className="font-medium">Drop an image here</span>
              <span className="text-xs">PNG, JPG, WebP, SVG, GIF · up to 10 MB</span>
            </div>
          )}
          {busy && (
            <div className="absolute inset-x-2 bottom-2">
              <Progress value={progress} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy || disabled}
            onClick={() => fileRef.current?.click()}
          >
            {value ? "Replace" : busy ? "Uploading…" : "Upload"}
          </Button>
          {value && !busy && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(null)}
            >
              Remove
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowUrlInput((v) => !v)}
          >
            {showUrlInput ? "Hide URL field" : "Use URL"}
          </Button>
          <input
            id={inputId}
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
        {showUrlInput && (
          <Input
            type="url"
            placeholder="https://…"
            defaultValue={value ?? ""}
            onBlur={(e) => onChange(e.target.value || null)}
          />
        )}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

