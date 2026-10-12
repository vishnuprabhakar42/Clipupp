"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, type PointerEvent, type ReactNode } from "react";

const DRAG_CLOSE_PX = 110;

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name. Rendered visually hidden; use SheetHeader for the visible title. Ignored when `labelledBy` is set. */
  title?: string;
  /** id of an element inside `children` (e.g. SheetHeader's title) that names the dialog. */
  labelledBy?: string;
  children: ReactNode;
  /** "auto" (default): bottom sheet below lg, centred modal at lg+. "sheet" / "modal" force one form. */
  size?: "auto" | "sheet" | "modal";
  className?: string;
};

export function Sheet({ open, onClose, title, labelledBy, children, size = "auto", className = "" }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const drag = useRef<{ startY: number; dy: number } | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      d.showModal();
      window.dispatchEvent(new Event("clipupp:dialog-open"));
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [open]);

  // Native "close" fires for Escape and for d.close(); keep the parent in sync
  // and hand focus back to the opener.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onNativeClose = () => {
      opener.current?.focus?.();
      opener.current = null;
      onClose();
    };
    d.addEventListener("close", onNativeClose);
    return () => d.removeEventListener("close", onNativeClose);
  }, [onClose]);

  const isSheetNow = () =>
    size === "sheet" || (size === "auto" && !window.matchMedia("(min-width: 1024px)").matches);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!isSheetNow()) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, dy: 0 };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = drag.current;
    if (!s) return;
    s.dy = Math.max(0, e.clientY - s.startY);
    if (ref.current) ref.current.style.translate = `0 ${s.dy}px`;
  };
  const endDrag = () => {
    const s = drag.current;
    drag.current = null;
    if (!s || !ref.current) return;
    ref.current.style.translate = "";
    if (s.dy > DRAG_CLOSE_PX) ref.current.close();
  };

  return (
    <dialog
      ref={ref}
      data-size={size}
      aria-labelledby={labelledBy ?? (title ? titleId : undefined)}
      onClick={(e) => {
        // The dialog has no padding, so a click that targets it is a backdrop click.
        if (e.target === ref.current) ref.current?.close();
      }}
      className={`clipupp-sheet ${className}`}
    >
      <div className="clipupp-sheet-up flex max-h-[inherit] flex-col">
        <div
          className="clipupp-sheet-handle flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-2.5"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          aria-hidden
        >
          <span className="h-1 w-10 rounded-full bg-clipupp-neutral-300" />
        </div>
        {title && !labelledBy ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </dialog>
  );
}

export type SheetHeaderProps = {
  /** Element id for the title; pass the same value as Sheet's `labelledBy`. */
  titleId?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Optional leading logo slot. */
  logo?: ReactNode;
  /** Extra controls placed before the close button. */
  actions?: ReactNode;
  onClose: () => void;
};

export function SheetHeader({ titleId, title, subtitle, logo, actions, onClose }: SheetHeaderProps) {
  const t = useTranslations("common");
  return (
    <div className="flex items-center gap-3 px-5 pb-3 pt-2">
      {logo ? <div className="shrink-0">{logo}</div> : null}
      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="truncate text-[17px] font-bold leading-tight text-clipupp-neutral-900">
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 truncate text-[13px] text-clipupp-neutral-500">{subtitle}</p> : null}
      </div>
      {actions}
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-clipupp-neutral-800 hover:bg-clipupp-neutral-100"
      >
        <X size={20} aria-hidden />
      </button>
    </div>
  );
}
