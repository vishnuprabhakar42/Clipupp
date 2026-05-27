"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import {
  BadgeCheck,
  BookOpen,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  ExternalLink,
  Flame,
  GripVertical,
  HelpCircle,
  Images,
  LayoutGrid,
  Lightbulb,
  Mail,
  Pencil,
  Hash,
  MessageSquareQuote,
  Pin,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Type,
  Star,
  Store,
  TicketPercent,
  TrendingUp,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { homepageApi, type HomepageSection } from "@/lib/api/homepage";
import { isApiError } from "@/lib/api/errors";

/* ────────────────────────  Per-section theme tokens  ──────────────────── */

type Theme = {
  Icon: typeof Store;
  /** Tailwind colour name used to derive bar, badge, ring accents. */
  accent:
    // 5 brand roles. No more 8-color palette — every section type maps to
    // one of these to stay on-theme with the rest of the site.
    | "primary"
    | "accent"
    | "success"
    | "danger"
    | "neutral";
  description: string;
  featuredType?: "stores" | "coupons" | "categories";
};

const THEMES: Record<string, Theme> = {
  hero_search: {
    Icon: Search, accent: "primary",
    description: "Top-of-page search hero with category quick-jumps.",
  },
  trending_stores: {
    Icon: Flame, accent: "primary",
    description: "Horizontal store rail above the fold.",
    featuredType: "stores",
  },
  promo_banners: {
    Icon: Images, accent: "primary",
    description: "Two-up promo banner carousel.",
  },
  savings_stats: {
    Icon: TrendingUp, accent: "success",
    description: "Four large numeric stat tiles (social proof).",
  },
  featured_stores: {
    Icon: Star, accent: "primary",
    description: "Editorial featured-stores grid.",
    featuredType: "stores",
  },
  daily_picks: {
    Icon: Sparkles, accent: "accent",
    description: "Editor's picks — 1 featured + 3 small deal cards.",
    featuredType: "coupons",
  },
  top_deals: {
    Icon: TicketPercent, accent: "primary",
    description: "Top deal cards row.",
    featuredType: "coupons",
  },
  editorial: {
    Icon: BookOpen, accent: "primary",
    description: "Blog posts strip.",
  },
  popular_categories: {
    Icon: LayoutGrid, accent: "primary",
    description: "Category tiles grid.",
    featuredType: "categories",
  },
  trusted_brands: {
    Icon: Pin, accent: "primary",
    description: "Brand logo carousel.",
    featuredType: "stores",
  },
  editorial_tips: {
    Icon: Lightbulb, accent: "primary",
    description: "Editorial 'how to save' tip tiles.",
  },
  guarantees: {
    Icon: ShieldCheck, accent: "success",
    description: "Four-up trust strip (verified, free, no spam, curated).",
  },
  faq: {
    Icon: HelpCircle, accent: "neutral",
    description: "FAQ accordion with FAQPage JSON-LD for rich results.",
  },
  newsletter: {
    Icon: Mail, accent: "primary",
    description: "Email signup bar.",
  },
};

const ACCENT_STYLES: Record<Theme["accent"], {
  bar: string;
  iconBg: string;
  iconColor: string;
  chip: string;
  ring: string;
  /** Tailwind class for the section card's outer border (collapsed) */
  border: string;
  /** Darker variant used when the section is expanded for edit */
  borderDark: string;
  /** Linear gradient used on the save button & soft surfaces in the panel */
  gradient: string;
  /** Faint radial backdrop colour for the expanded edit panel */
  panelBg: string;
}> = {
  primary: { bar: "bg-cv-primary", iconBg: "bg-cv-primary-soft", iconColor: "text-cv-primary", chip: "bg-cv-primary-soft text-cv-primary-strong", ring: "ring-cv-primary/30", border: "border-cv-primary", borderDark: "border-cv-primary-strong",
             gradient: "linear-gradient(120deg,var(--cv-primary) 0%,var(--cv-primary-strong) 100%)",
             panelBg:  "radial-gradient(70% 50% at 100% 0%, rgba(59,130,246,0.07) 0%, transparent 70%)" },
  accent:  { bar: "bg-cv-accent",  iconBg: "bg-cv-accent-soft",  iconColor: "text-cv-accent",  chip: "bg-cv-accent-soft text-cv-accent-strong",  ring: "ring-cv-accent/30",  border: "border-cv-accent",  borderDark: "border-cv-accent-strong",
             gradient: "linear-gradient(120deg,var(--cv-accent) 0%,var(--cv-accent-strong) 100%)",
             panelBg:  "radial-gradient(70% 50% at 100% 0%, rgba(249,115,22,0.07) 0%, transparent 70%)" },
  success: { bar: "bg-cv-success", iconBg: "bg-cv-success-soft", iconColor: "text-cv-success", chip: "bg-cv-success-soft text-cv-success-strong", ring: "ring-cv-success/30", border: "border-cv-success", borderDark: "border-cv-success-strong",
             gradient: "linear-gradient(120deg,var(--cv-success) 0%,var(--cv-success-strong) 100%)",
             panelBg:  "radial-gradient(70% 50% at 100% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)" },
  danger:  { bar: "bg-cv-danger",  iconBg: "bg-cv-danger-soft",  iconColor: "text-cv-danger",  chip: "bg-cv-danger-soft text-cv-danger-strong",  ring: "ring-cv-danger/30",  border: "border-cv-danger",  borderDark: "border-cv-danger-strong",
             gradient: "linear-gradient(120deg,var(--cv-danger) 0%,var(--cv-danger-strong) 100%)",
             panelBg:  "radial-gradient(70% 50% at 100% 0%, rgba(220,38,38,0.07) 0%, transparent 70%)" },
  neutral: { bar: "bg-cv-neutral-500", iconBg: "bg-cv-neutral-100", iconColor: "text-cv-neutral-600", chip: "bg-cv-neutral-100 text-cv-neutral-700", ring: "ring-cv-neutral-300", border: "border-cv-neutral-400", borderDark: "border-cv-neutral-600",
             gradient: "linear-gradient(120deg,var(--cv-neutral-500) 0%,var(--cv-neutral-700) 100%)",
             panelBg:  "radial-gradient(70% 50% at 100% 0%, rgba(71,85,105,0.06) 0%, transparent 70%)" },
};

const DEFAULT_THEME: Theme = {
  Icon: Sparkles, accent: "neutral", description: "Custom section.",
};

function themeFor(code: string): Theme {
  return THEMES[code] ?? DEFAULT_THEME;
}

/* ─────────────────────────────  Editor root  ──────────────────────────── */

export function HomepageSectionsEditor({ initial }: { initial: HomepageSection[] }) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sections, oldIndex, newIndex);
    const prev = sections;
    setSections(next);
    setBusy(true);
    try {
      await homepageApi.reorderSections(next.map((s) => s.id));
      toast.success("Order saved");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Reorder failed");
      setSections(prev);
    } finally {
      setBusy(false);
    }
  }

  async function onSaveSection(
    id: string,
    patch: Parameters<typeof homepageApi.updateSection>[1]
  ) {
    setBusy(true);
    try {
      const updated = await homepageApi.updateSection(id, patch);
      setSections((arr) => arr.map((s) => (s.id === id ? updated : s)));
      toast.success("Section saved");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onToggleEnabled(id: string, enabled: boolean) {
    // Optimistic update so the live/hidden chip + counter flip instantly.
    setSections((arr) => arr.map((s) => (s.id === id ? { ...s, enabled } : s)));
    setBusy(true);
    try {
      const updated = await homepageApi.updateSection(id, { enabled });
      setSections((arr) => arr.map((s) => (s.id === id ? updated : s)));
      toast.success(enabled ? "Section enabled" : "Section hidden");
      router.refresh();
    } catch (err) {
      toast.error(isApiError(err) ? err.message : "Toggle failed");
      setSections((arr) => arr.map((s) => (s.id === id ? { ...s, enabled: !enabled } : s)));
    } finally {
      setBusy(false);
    }
  }

  const enabled = sections.filter((s) => s.enabled).length;

  return (
    <>
      {/* Slim status bar — one line, dense, useful. */}
      <section className="mb-6 flex flex-wrap items-center gap-4 rounded-md border bg-white px-4 py-3 shadow-sm">
        {/* Live count */}
        <div className="flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center rounded-md bg-cv-success-soft">
            <Eye className="h-4 w-4 text-cv-success" />
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cv-success ring-2 ring-white"
            />
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold tabular-nums text-gray-900">
              {enabled} <span className="font-normal text-cv-neutral-400">/ {sections.length}</span>
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-cv-neutral-500">
              Live sections
            </p>
          </div>
        </div>

        {/* Vertical divider */}
        <span className="hidden h-8 w-px bg-gray-200 sm:block" aria-hidden />

        {/* Tiny order dots — uniform neutral chips with a coloured dot
            accent inside, so no single chip ever appears more saturated
            than another (the previous version used per-type pastel bg's,
            which made warm tones like rose/pink visually "pop"). */}
        <ol className="flex flex-1 flex-wrap items-center gap-1">
          {sections.map((s, i) => {
            const accent = ACCENT_STYLES[themeFor(s.code).accent];
            const live = s.enabled;
            const open = expandedId === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((cur) => (cur === s.id ? null : s.id))
                  }
                  aria-pressed={open}
                  title={`${i + 1}. ${s.title || s.code} — ${live ? "Live" : "Hidden"}`}
                  aria-label={`${s.title || s.code}: ${live ? "Live" : "Hidden"}`}
                  className={`grid h-7 w-7 place-items-center rounded-md border-l-4 text-[10px] font-bold tabular-nums transition hover:-translate-y-0.5 hover:shadow-sm ${
                    open ? "ring-2 ring-offset-1 " + accent.ring : ""
                  } ${
                    live
                      ? `border-l-current ${accent.iconColor} border-y border-r border-y-gray-200 border-r-gray-200 bg-white`
                      : "border-y border-r border-y-gray-200 border-r-gray-200 border-l-gray-300 bg-gray-50 text-cv-neutral-400"
                  }`}
                >
                  {i + 1}
                </button>
              </li>
            );
          })}
        </ol>

        {/* Open live home — the only CTA worth showing here */}
        <Link
          href="/"
          target="_blank"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-50"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open live
        </Link>
      </section>

      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Sections</h2>
          <p className="text-xs text-cv-neutral-500">
            Drag to reorder · click the pencil to edit · toggle to hide
          </p>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {sections.map((s, i) => (
              <SortableSectionRow
                key={s.id}
                section={s}
                position={i}
                busy={busy}
                isExpanded={expandedId === s.id}
                onToggleExpand={() =>
                  setExpandedId((cur) => (cur === s.id ? null : s.id))
                }
                onSave={async (patch) => {
                  await onSaveSection(s.id, patch);
                  setExpandedId(null);
                }}
                onToggleEnabled={(v) => onToggleEnabled(s.id, v)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}

/* ──────────────────────────  Per-section row  ─────────────────────────── */

function SortableSectionRow({
  section,
  position,
  busy,
  isExpanded,
  onToggleExpand,
  onSave,
  onToggleEnabled,
}: {
  section: HomepageSection;
  position: number;
  busy: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSave: (patch: Parameters<typeof homepageApi.updateSection>[1]) => Promise<void>;
  onToggleEnabled: (v: boolean) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const theme = themeFor(section.code);
  const Icon = theme.Icon;
  const styles = ACCENT_STYLES[theme.accent];

  const [draft, setDraft] = useState(() => snapshotOf(section));
  useEffect(() => {
    setDraft(snapshotOf(section));
  }, [section.id, section.title, section.subtitle, section.itemLimit, section.enabled]);

  const dirty =
    draft.title !== (section.title ?? "") ||
    draft.subtitle !== (section.subtitle ?? "") ||
    (draft.itemLimit ?? null) !== (section.itemLimit ?? null) ||
    draft.enabled !== section.enabled;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.92 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={{
        ...style,
        // Soft accent-tinted backdrop so each row carries its section's
        // colour identity even when collapsed. Layered radial wash + faint
        // top-down white fade so the row still reads as "white card" while
        // hinting at the accent.
        backgroundImage: `${styles.panelBg}, linear-gradient(180deg,#ffffff 0%,#ffffff 100%)`,
      }}
      className={`group relative overflow-hidden rounded-md border-2 shadow-sm transition ${
        isExpanded ? styles.borderDark : styles.border
      } ${
        isDragging
          ? `ring-2 ${styles.ring} shadow-md`
          : isExpanded
            ? "shadow-md ring-1 ring-black/5"
            : "hover:-translate-y-px hover:shadow-md"
      }`}
    >
      {/* Left accent bar — 4px coloured rail */}
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${styles.bar}`} />

      {/* Compact header row */}
      <div className="flex items-center gap-3 pl-4 pr-3 py-3">
        {/* Position chip */}
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gray-50 text-sm font-bold tabular-nums text-gray-900 ring-1 ring-gray-200"
          aria-hidden
        >
          {position + 1}
        </span>

        {/* Drag handle — only visible on hover for less visual clutter */}
        <button
          type="button"
          aria-label="Drag to reorder"
          className="grid h-9 w-7 shrink-0 cursor-grab place-items-center rounded-md text-gray-300 transition group-hover:text-cv-neutral-500 hover:bg-gray-50 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Icon */}
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${styles.iconBg}`}>
          <Icon className={`h-5 w-5 ${styles.iconColor}`} aria-hidden />
        </span>

        {/* Title block */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[15px] font-semibold tracking-tight text-gray-900">
              {section.title || section.code}
            </p>
            <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${styles.chip}`}>
              {section.code}
            </span>
          </div>
          <p className="truncate text-xs text-cv-neutral-500">
            {section.subtitle || theme.description}
          </p>
        </div>

        {/* Status pill */}
        <span
          className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:inline-flex ${
            section.enabled
              ? "bg-cv-success-soft text-cv-success-strong ring-1 ring-cv-success/30"
              : "bg-gray-100 text-cv-neutral-500 ring-1 ring-gray-200"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${section.enabled ? "bg-cv-success" : "bg-gray-400"}`}
            aria-hidden
          />
          {section.enabled ? "Live" : "Hidden"}
        </span>

        {/* Quick actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/#${section.code}`}
            target="_blank"
            className="hidden items-center gap-1 rounded-md border bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:inline-flex"
            aria-label="Preview on site"
          >
            <Eye className="h-3 w-3" />
            Preview
            <ExternalLink className="h-3 w-3 opacity-50" />
          </Link>
          <Switch
            checked={section.enabled}
            onCheckedChange={(v) => onToggleEnabled(v)}
            aria-label="Enabled"
          />
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse" : "Edit section"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-cv-neutral-500 transition hover:bg-gray-50 hover:text-gray-900"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <Pencil className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded editor — full-featured panel only mounted when active */}
      {isExpanded && (
        <SectionEditPanel
          section={section}
          draft={draft}
          setDraft={setDraft}
          dirty={dirty}
          busy={busy}
          theme={theme}
          onSave={() =>
            onSave({
              title: draft.title,
              subtitle: draft.subtitle,
              itemLimit: draft.itemLimit ?? undefined,
              enabled: draft.enabled,
            })
          }
          onClose={onToggleExpand}
          onResetDraft={() => setDraft(snapshotOf(section))}
        />
      )}
    </li>
  );
}

function snapshotOf(s: HomepageSection) {
  return {
    title: s.title ?? "",
    subtitle: s.subtitle ?? "",
    itemLimit: s.itemLimit ?? null,
    enabled: s.enabled,
  };
}

/* ─────────────────────────  Edit panel (expanded)  ──────────────────────── */

type Draft = ReturnType<typeof snapshotOf>;

const TITLE_MAX = 60;          // SEO-ish cap for headings
const SUBTITLE_MAX = 160;      // meta-description scale
const LIMIT_PRESETS = [4, 6, 8, 10, 12, 16, 20];

function SectionEditPanel({
  section,
  draft,
  setDraft,
  dirty,
  busy,
  theme,
  onSave,
  onClose,
  onResetDraft,
}: {
  section: HomepageSection;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  dirty: boolean;
  busy: boolean;
  theme: Theme;
  onSave: () => void;
  onClose: () => void;
  onResetDraft: () => void;
}) {
  const styles = ACCENT_STYLES[theme.accent];
  const Icon = theme.Icon;
  const titleLen = draft.title.length;
  const subtitleLen = draft.subtitle.length;
  const titleOver = titleLen > TITLE_MAX;
  const subtitleOver = subtitleLen > SUBTITLE_MAX;

  // ⌘/Ctrl+S to save · Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !busy) onSave();
      } else if (e.key === "Escape") {
        if (dirty) onResetDraft();
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, busy, onSave, onResetDraft, onClose]);

  return (
    <div
      className="relative border-t"
      style={{
        backgroundImage: `${styles.panelBg}, linear-gradient(180deg,#fbfbfc 0%,#ffffff 100%)`,
      }}
    >
      {/* Header ribbon — gradient strip with the section icon */}
      <div
        className="relative flex items-center gap-2.5 px-4 py-2.5 text-white"
        style={{ background: styles.gradient }}
      >
        <span className="grid h-6 w-6 place-items-center rounded-md bg-white/25 ring-1 ring-white/40 backdrop-blur">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
          Editing
        </span>
        <code className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold ring-1 ring-white/30">
          {section.code}
        </code>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-white/90">
          <Clock className="h-3 w-3" />
          {relativeTime(section.updatedAt)}
        </span>
      </div>

      <div className="px-4 py-5">
        {/* ─── Form column ─── */}
        <div className="space-y-3">
          {/* Title card */}
          <FieldCard
            label="Heading"
            help="What visitors see as the section title."
            icon={<Type className="h-3.5 w-3.5" />}
            accentBg={styles.iconBg}
            accentColor={styles.iconColor}
            counter={
              <Counter current={titleLen} max={TITLE_MAX} over={titleOver} />
            }
          >
            <Input
              id={`title-${section.id}`}
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Best Coupons This Week"
              className={`border-0 bg-gray-50 focus-visible:bg-white ${
                titleOver ? "ring-2 ring-rose-300 focus-visible:ring-rose-400" : ""
              }`}
            />
            {titleOver && (
              <p className="mt-1.5 text-[10px] font-medium text-cv-accent">
                Long headings truncate on mobile. Consider trimming.
              </p>
            )}
          </FieldCard>

          {/* Subtitle card */}
          <FieldCard
            label="Subtitle"
            help="A one-liner that supports the heading. Optional."
            icon={<MessageSquareQuote className="h-3.5 w-3.5" />}
            accentBg={styles.iconBg}
            accentColor={styles.iconColor}
            counter={
              <Counter current={subtitleLen} max={SUBTITLE_MAX} over={subtitleOver} />
            }
          >
            <Textarea
              id={`subtitle-${section.id}`}
              rows={2}
              value={draft.subtitle}
              onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
              placeholder="One-line hook shown beneath the heading."
              className={`border-0 bg-gray-50 focus-visible:bg-white ${
                subtitleOver ? "ring-2 ring-rose-300 focus-visible:ring-rose-400" : ""
              }`}
            />
          </FieldCard>

          {/* Item-limit card */}
          <FieldCard
            label="Item limit"
            help="How many items the API returns for this section. Leave blank to use the component default."
            icon={<Hash className="h-3.5 w-3.5" />}
            accentBg={styles.iconBg}
            accentColor={styles.iconColor}
            counter={
              draft.itemLimit !== null ? (
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, itemLimit: null }))}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-cv-neutral-500 hover:text-gray-900"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              ) : null
            }
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {LIMIT_PRESETS.map((n) => {
                const active = draft.itemLimit === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, itemLimit: n }))}
                    className={`grid h-8 min-w-[32px] place-items-center rounded-md px-2 text-[11px] font-bold tabular-nums transition ${
                      active
                        ? "text-white shadow-md"
                        : "border border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
                    }`}
                    style={active ? { background: styles.gradient } : undefined}
                  >
                    {n}
                  </button>
                );
              })}
              <Input
                id={`limit-${section.id}`}
                type="number"
                min={0}
                value={draft.itemLimit ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    itemLimit: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                placeholder="Custom"
                className="h-8 w-20 border-0 bg-gray-50 px-2 text-[11px] focus-visible:bg-white"
              />
            </div>
          </FieldCard>

          {theme.featuredType && (
            <Link
              href={`/admin/homepage/${section.code}`}
              className="group inline-flex w-full items-center justify-center gap-1.5 rounded-md border bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded ${styles.iconBg} ${styles.iconColor}`}
              >
                <Pin className="h-3 w-3" />
              </span>
              Pin featured {theme.featuredType}
              <ExternalLink className="h-3 w-3 opacity-50 transition group-hover:opacity-100" />
            </Link>
          )}
        </div>
      </div>

      {/* Footer: hints + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-white/80 px-4 py-2.5 backdrop-blur">
        <p className="hidden items-center gap-3 text-[10px] text-cv-neutral-500 sm:flex">
          <span className="inline-flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>S</Kbd>
            Save
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Esc</Kbd>
            {dirty ? "Discard" : "Close"}
          </span>
        </p>
        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <button
              type="button"
              onClick={onResetDraft}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </button>
          <button
            type="button"
            disabled={busy || !dirty || titleOver || subtitleOver}
            onClick={onSave}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            style={{
              background:
                busy || !dirty || titleOver || subtitleOver
                  ? "linear-gradient(120deg,#9ca3af 0%,#9ca3af 100%)"
                  : styles.gradient,
            }}
          >
            {busy ? "Saving…" : dirty ? "Save changes" : "No changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── helpers used by SectionEditPanel ─── */

function FieldCard({
  label,
  help,
  icon,
  accentBg,
  accentColor,
  counter,
  children,
}: {
  label: string;
  help?: string;
  icon: React.ReactNode;
  accentBg: string;
  accentColor: string;
  counter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-white p-3 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-center gap-2">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${accentBg} ${accentColor}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-gray-900">{label}</p>
          {help && <p className="text-[10px] leading-snug text-cv-neutral-500">{help}</p>}
        </div>
        {counter && <div className="shrink-0">{counter}</div>}
      </div>
      {children}
    </div>
  );
}

function Counter({
  current,
  max,
  over,
}: {
  current: number;
  max: number;
  over: boolean;
}) {
  const ratio = Math.min(current / max, 1);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
        over
          ? "bg-cv-accent-soft text-cv-accent-strong ring-1 ring-cv-accent/30"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      <span
        aria-hidden
        className={`h-1 w-6 overflow-hidden rounded-full bg-gray-200`}
      >
        <span
          className={`block h-full rounded-full transition-all ${
            over ? "bg-cv-accent" : "bg-cv-success"
          }`}
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
      {current}/{max}
    </span>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-gray-700 shadow-[inset_0_-1px_0_rgba(0,0,0,0.06)]">
      {children}
    </kbd>
  );
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
