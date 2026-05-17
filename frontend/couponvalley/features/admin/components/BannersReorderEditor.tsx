"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical } from "lucide-react";
import { adminApi, type AdminBannerRow } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

/**
 * Drag-reorder list for /admin/banners. The whole list is sortable; on drop
 * we POST the new id order to /api/v1/admin/banners/reorder and the backend
 * stamps fresh 0..N-1 positions. Optimistic UI: the list updates immediately,
 * reverts on failure.
 */
export function BannersReorderEditor({ initial }: { initial: AdminBannerRow[] }) {
  const [banners, setBanners] = useState(initial);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(banners, oldIndex, newIndex);
    const previous = banners;
    setBanners(next);
    setBusy(true);
    try {
      await adminApi.reorderBanners(next.map((b) => b.id));
      toast.success("Banner order saved");
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Reorder failed");
      setBanners(previous);
    } finally {
      setBusy(false);
    }
  }

  if (banners.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No banners configured yet. Create one via the &quot;New banner&quot; button.
      </p>
    );
  }

  return (
    <>
      <p className="mb-3 text-xs text-muted-foreground">
        Drag the <GripVertical className="inline h-3 w-3 align-text-bottom" /> handle to reorder.
        The order here is the order banners appear in the home page carousel.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2.5">
            {banners.map((b, i) => (
              <SortableBannerRow key={b.id} banner={b} index={i} busy={busy} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}

function SortableBannerRow({
  banner,
  index,
  busy,
}: {
  banner: AdminBannerRow;
  index: number;
  busy: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.9 : busy ? 0.7 : 1,
  };

  const startsAt = banner.startsAt ? new Date(banner.startsAt) : null;
  const endsAt = banner.endsAt ? new Date(banner.endsAt) : null;
  const now = new Date();
  const live =
    banner.active &&
    (!startsAt || startsAt <= now) &&
    (!endsAt || endsAt > now);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex gap-3 rounded-md border bg-card p-3"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {banner.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.imageUrl}
          alt=""
          className="h-16 w-28 shrink-0 rounded-md object-cover ring-1 ring-black/5"
          loading="lazy"
        />
      ) : (
        <div className="h-16 w-28 shrink-0 rounded-md bg-muted ring-1 ring-black/5" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-700">
            #{index + 1}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              live
                ? "bg-cv-success-soft text-cv-success-strong"
                : "bg-gray-100 text-cv-neutral-500"
            }`}
          >
            {live ? "Live" : banner.active ? "Scheduled / Ended" : "Inactive"}
          </span>
          <span className="rounded-full bg-cv-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cv-primary-strong">
            {banner.placement ?? "PROMO_CARD"}
          </span>
          <span className="text-[10px] text-cv-neutral-400">
            pos {banner.position} · {banner.countryCode ?? "Global"}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-gray-900">{banner.title}</p>
        {banner.subtitle && (
          <p className="line-clamp-1 text-xs text-cv-neutral-500">{banner.subtitle}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/admin/banners/${banner.id}`}
          className="text-xs font-semibold text-cv-primary hover:underline"
        >
          Edit
        </Link>
        {banner.linkUrl && (
          <Link
            href={banner.linkUrl}
            target="_blank"
            className="text-xs text-cv-neutral-400 hover:text-gray-700"
            aria-label="Open link"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </li>
  );
}
