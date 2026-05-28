"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { homepageApi, type FeaturedItem, type FeaturedType } from "@/lib/api/homepage";
import { adminApi } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/errors";

type Candidate = { slug: string; title: string; imageUrl: string | null };

export function FeaturedItemsEditor({
  type,
  initial,
}: {
  type: FeaturedType;
  initial: FeaturedItem[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Candidate[]>(initial);
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);

  const selectedSlugs = useMemo(() => new Set(items.map((i) => i.slug)), [items]);

  // Debounced search against the relevant admin list endpoint.
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = search.trim();
      if (!q) {
        setCandidates([]);
        return;
      }
      setSearching(true);
      try {
        if (type === "stores") {
          const r = await adminApi.listAdminStores({ q, size: 30 });
          setCandidates(
            r.content.map((s) => ({
              slug: s.slug,
              title: s.name,
              imageUrl: s.logoUrl,
            }))
          );
        } else if (type === "coupons") {
          const r = await adminApi.listAdminCoupons({ q, size: 30 });
          setCandidates(
            r.content.map((c) => ({
              slug: c.slug,
              title: c.title,
              imageUrl: c.storeLogoUrl,
            }))
          );
        } else {
          const all = await adminApi.listAdminCategories();
          const lower = q.toLowerCase();
          setCandidates(
            all
              .filter((c) => c.title.toLowerCase().includes(lower) || c.slug.toLowerCase().includes(lower))
              .map((c) => ({ slug: c.slug, title: c.title, imageUrl: null }))
          );
        }
      } catch {
        // Soft-fail: search results just stay empty.
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [search, type]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.slug === active.id);
    const newIndex = items.findIndex((i) => i.slug === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setItems(arrayMove(items, oldIndex, newIndex));
  }

  function add(c: Candidate) {
    if (selectedSlugs.has(c.slug)) return;
    setItems((arr) => [...arr, c]);
  }

  function remove(slug: string) {
    setItems((arr) => arr.filter((i) => i.slug !== slug));
  }

  async function save() {
    setBusy(true);
    try {
      await homepageApi.setFeatured(
        type,
        items.map((it, i) => ({ slug: it.slug, position: i }))
      );
      toast.success("Featured list saved");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Featured order ({items.length})
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Drag to reorder.{" "}
          <span className="font-semibold text-foreground">
            Position 0 becomes the hero card
          </span>{" "}
          (2× wider on the homepage). An empty list falls back to the default popularity-sorted ordering.
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.slug)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {items.map((i, idx) => (
                <FeaturedRow
                  key={i.slug}
                  item={i}
                  isHero={idx === 0 && type === "stores"}
                  onRemove={() => remove(i.slug)}
                />
              ))}
              {items.length === 0 && (
                <li className="rounded-md border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  Nothing pinned. Search on the right to add items.
                </li>
              )}
            </ul>
          </SortableContext>
        </DndContext>

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save featured list"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setItems([])} disabled={busy}>
            Clear all
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Search to add
        </h2>
        <Input
          placeholder={`Search ${type}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className="mt-3 max-h-[480px] space-y-1 overflow-y-auto rounded-md border bg-card p-2">
          {searching && <li className="px-3 py-2 text-xs text-muted-foreground">Searching…</li>}
          {!searching && search && candidates.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">No matches.</li>
          )}
          {!searching && !search && (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              Start typing to search.
            </li>
          )}
          {candidates.map((c) => {
            const already = selectedSlugs.has(c.slug);
            return (
              <li key={c.slug}>
                <button
                  type="button"
                  disabled={already}
                  onClick={() => add(c)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${
                    already
                      ? "cursor-not-allowed bg-muted/40 text-muted-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {c.imageUrl ? (
                    <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.imageUrl} alt="" className="h-full w-full object-contain" />
                    </span>
                  ) : (
                    <div className="h-7 w-7 shrink-0 rounded bg-muted" />
                  )}
                  <span className="flex-1 truncate">{c.title}</span>
                  <span className="text-xs font-mono text-muted-foreground">{c.slug}</span>
                  <Plus className="h-4 w-4 shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function FeaturedRow({
  item,
  isHero,
  onRemove,
}: {
  item: Candidate;
  isHero?: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.slug,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border bg-card px-3 py-2 ${
        isHero ? "ring-2 ring-clipupp-primary ring-offset-2" : ""
      }`}
    >
      {isHero && (
        <span className="rounded-full bg-clipupp-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Hero
        </span>
      )}
      <button
        type="button"
        aria-label="Drag to reorder"
        className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {item.imageUrl ? (
        <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
        </span>
      ) : (
        <div className="h-7 w-7 shrink-0 rounded bg-muted" />
      )}
      <span className="flex-1 truncate text-sm font-medium">{item.title}</span>
      <span className="text-xs font-mono text-muted-foreground">{item.slug}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Remove ${item.title}`}
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}
