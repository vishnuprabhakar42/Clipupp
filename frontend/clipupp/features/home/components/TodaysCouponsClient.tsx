"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronDown, Tag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { loadTodayCoupons } from "../actions/todayCoupons";
import { emit, on, peek } from "@/lib/home/homeBus";
import type { RowItem } from "../lib/todayRows";
import { sortItems, type Sort } from "../lib/todaySort";
import { applyPage, safeLoad } from "../lib/todayState";
import { parseTodayParams, todayParamsToSearch } from "../lib/todayUrl";
import { TabInk } from "./TabInk";

type Req = { mode: "reset" | "append"; tab: string; store: string; cursor: string | null; startIndex: number };

type Tab = { id: string; label: string; title: string; count: number };

const STORAGE_KEY = "clipupp:tab";
const SCROLL_KEY = "clipupp:today:scroll";
const SORTS: Sort[] = ["pop", "new", "end", "rate"];
const PANEL_ID = "today-panel";
const tabId = (id: string) => `today-tab-${id}`;

function read(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function write(v: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, v);
  } catch {}
}

/**
 * Where the reader was in the list when they followed a coupon link. `id` is
 * also stamped on that history entry, so only Back to that entry restores (a
 * fresh visit to the homepage, say from the logo, does not jump down the page).
 */
type ScrollEntry = { id: string; y: number; loaded: number; href: string };
const HISTORY_KEY = "clipuppToday";
const here = () => window.location.pathname + window.location.search;
const historyMark = (): unknown => (window.history.state as Record<string, unknown> | null)?.[HISTORY_KEY];
/** Stamp or clear the mark on the current entry. Next's own `__NA` state rides along, so its router is not involved. */
function setHistoryMark(id: string | undefined) {
  const st = { ...((window.history.state as Record<string, unknown> | null) ?? {}) };
  if (id) st[HISTORY_KEY] = id;
  else delete st[HISTORY_KEY];
  window.history.replaceState(st, "");
}

function readScroll(): ScrollEntry | null {
  try {
    const raw = window.sessionStorage.getItem(SCROLL_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<ScrollEntry>;
    return typeof v.id === "string" && typeof v.y === "number" && typeof v.loaded === "number" && typeof v.href === "string"
      ? (v as ScrollEntry)
      : null;
  } catch {
    return null;
  }
}
function writeScroll(v: ScrollEntry | null) {
  try {
    if (v) window.sessionStorage.setItem(SCROLL_KEY, JSON.stringify(v));
    else window.sessionStorage.removeItem(SCROLL_KEY);
  } catch {}
}

/**
 * The only part that reads `useSearchParams()`, so the Suspense boundary
 * around it keeps the rest of the list in the static HTML.
 */
function TodayUrlParams({ onParams }: { onParams: (sp: URLSearchParams) => void }) {
  const key = useSearchParams().toString();
  useEffect(() => onParams(new URLSearchParams(key)), [key, onParams]);
  return null;
}

export function TodaysCouponsClient({
  tabs,
  total,
  initial,
  initialCursor,
  storeNames,
  pageSize,
  alertsOnPage,
}: {
  tabs: Tab[];
  total: number;
  initial: RowItem[];
  /** Cursor after the server-rendered first page; null when the list is complete. */
  initialCursor: string | null;
  storeNames: Record<string, string>;
  pageSize: number;
  /** True when the alerts block renders on the page, so the empty state can point at it. */
  alertsOnPage: boolean;
}) {
  const t = useTranslations("home.today");
  const [tab, setTab] = useState("all");
  const [store, setStore] = useState("");
  const [sort, setSort] = useState<Sort>("pop");
  const [items, setItems] = useState<RowItem[]>(initial);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialCursor != null);
  const [fetching, setFetching] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  const gen = useRef(0);
  const lastReq = useRef<Req | null>(null);
  const self = useRef(Symbol("today"));
  const busy = useRef(false);
  const state = useRef({ tab, store, cursor, count: items.length, items });
  state.current = { tab, store, cursor, count: items.length, items };
  const sentinel = useRef<HTMLDivElement>(null);
  /** The URL has been read once; until then the URL is not written. */
  const [seeded, setSeeded] = useState(false);
  const seededRef = useRef(false);
  /** The reader changed the view (not a restore), so the URL also gets `#today`. */
  const dirty = useRef(false);
  /** Pending scroll restore after coming back from a coupon page. */
  const restore = useRef<ScrollEntry | null>(null);
  const [restoring, setRestoring] = useState(false);
  const jumped = useRef(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const visibleTabs = useMemo(
    () => [{ id: "all", label: t("all"), title: t("all"), count: total }, ...tabs.filter((x) => x.count > 0 || x.id === tab)],
    [tabs, total, tab, t],
  );

  const run = useCallback(
    async (mode: "reset" | "append", retry?: Req) => {
      if (mode === "append" && busy.current) return;
      const my = mode === "reset" ? ++gen.current : gen.current;
      busy.current = true;
      setFetching(true);
      setResetting(mode === "reset");
      setError(false);
      const s = state.current;
      const req: Req =
        retry ?? {
          mode,
          tab: s.tab,
          store: s.store,
          cursor: mode === "reset" ? null : s.cursor,
          startIndex: mode === "reset" ? 0 : s.count,
        };
      lastReq.current = req;
      const page = await safeLoad(() =>
        loadTodayCoupons({ tab: req.tab, store: req.store, cursor: req.cursor, limit: pageSize, startIndex: req.startIndex }),
      );
      if (my !== gen.current) return;
      busy.current = false;
      setFetching(false);
      setResetting(false);
      const next = applyPage<RowItem>({ items: state.current.items, cursor: state.current.cursor, hasMore: true, error: false }, mode, page);
      setError(next.error);
      setItems(next.items);
      setCursor(next.cursor);
      setHasMore(next.hasMore);
    },
    [pageSize],
  );

  // Fresh first page whenever the tab or store changes (the initial "All" page is server-rendered).
  // Keyed so a StrictMode double effect run does not fetch twice.
  const loadedKey = useRef("all|");
  useEffect(() => {
    const key = `${tab}|${store}`;
    if (key === loadedKey.current) return;
    loadedKey.current = key;
    void run("reset");
  }, [tab, store, run]);

  useEffect(() => setNow(Date.now()), []);

  const select = useCallback((id: string, notify = true) => {
    dirty.current = true;
    setStore("");
    setTab(id);
    write(id);
    if (notify) emit("today:tab", id, self.current);
  }, []);

  const knownTabs = useMemo(() => ["all", ...tabs.map((x) => x.id)], [tabs]);
  // A shared `?store=` the feed does not know falls back to All (and leaves the URL on the next write).
  const knownStores = useMemo(() => Object.keys(storeNames), [storeNames]);

  /** The view as the URL alone describes it (no saved tab); what the address bar shows until the visitor changes something. */
  const urlView = useRef<{ tab: string; sort: Sort; store: string }>({ tab: "all", sort: "pop", store: "" });
  /**
   * The search string last applied or written. A repeat (our own `replaceState`
   * echo, or a StrictMode effect re-run) is ignored, so it cannot undo a saved tab.
   */
  const lastSearch = useRef<string | null>(null);

  // The URL drives the view. On the first read a URL without `tab` falls back
  // to the bus (a rail chip pressed before hydration), then the saved tab.
  const applyUrl = useCallback(
    (sp: URLSearchParams) => {
      const first = !seededRef.current;
      if (!first && sp.toString() === lastSearch.current) return;
      lastSearch.current = sp.toString();
      seededRef.current = true;
      // A URL change this component did not make (say the logo back to "/") starts a fresh visit.
      if (!first) dirty.current = false;
      const p = parseTodayParams(sp, { tabs: knownTabs, sorts: SORTS, stores: knownStores });
      let next = p.store ? "all" : p.tab;
      urlView.current = { tab: next, sort: p.sort as Sort, store: p.store ?? "" };
      if (first && !p.store && !sp.has("tab")) {
        const saved = peek("today:tab") ?? read();
        if (saved && knownTabs.includes(saved)) next = saved;
      }
      setStore(p.store ?? "");
      setTab(next);
      setSort(p.sort as Sort);
      // Keep the header rail in step, including back to "all" once the bus holds a category.
      const last = peek("today:tab");
      if (last !== next && (next !== "all" || last != null)) emit("today:tab", next, self.current);
      if (first) setSeeded(true);
    },
    [knownTabs, knownStores],
  );

  // Mirror the view into the URL without a navigation (router.replace would refetch the RSC payload).
  const showRate = items.some((i) => i.coupon.success != null);
  // "rate" without any loaded success rate shows as "pop", in the select and in the URL.
  const effectiveSort: Sort = sort === "rate" && !showRate ? "pop" : sort;
  // Until the visitor changes something only the URL's own params are written
  // back (normalised), so a saved tab never appears in the address bar by itself.
  useEffect(() => {
    if (!seeded) return;
    const u = urlView.current;
    const view = dirty.current
      ? { tab: store ? "all" : tab, sort: effectiveSort, store: store || null }
      : { tab: u.tab, sort: u.sort === "rate" && !showRate ? "pop" : u.sort, store: u.store || null };
    const search = todayParamsToSearch(view, undefined, new URLSearchParams(window.location.search));
    const url = window.location.pathname + search + (dirty.current ? "#today" : window.location.hash);
    if (url === here() + window.location.hash) return;
    lastSearch.current = search.slice(1);
    // Keep any custom keys on the entry; Next's patched replaceState re-adds its own state and syncs the router.
    const { __NA: _na, __PRIVATE_NEXTJS_INTERNALS_TREE: _tree, ...custom } =
      (window.history.state as Record<string, unknown> | null) ?? {};
    window.history.replaceState(custom, "", url);
  }, [seeded, tab, store, effectiveSort, showRate]);

  // Coming back from a coupon page: pick up the saved position for this history entry and URL.
  useEffect(() => {
    const entry = readScroll();
    if (!entry || historyMark() !== entry.id || entry.href !== here()) return;
    restore.current = entry;
    setRestoring(true);
  }, []);

  // Reload as many items as were loaded, then put the reader back where they were.
  useEffect(() => {
    const r = restore.current;
    if (!r || !seeded) return;
    // Jump right away so the reader does not watch the page sit elsewhere while pages reload.
    if (!jumped.current) {
      jumped.current = true;
      window.scrollTo({ top: r.y, behavior: "instant" });
    }
    if (busy.current || fetching || loadedKey.current !== `${tab}|${store}`) return;
    if (items.length < r.loaded && hasMore && !error) {
      void run("append");
      return;
    }
    restore.current = null;
    writeScroll(null);
    if (historyMark() === r.id) setHistoryMark(undefined);
    setRestoring(false);
    requestAnimationFrame(() => window.scrollTo({ top: r.y, behavior: "instant" }));
  }, [restoring, seeded, fetching, items.length, hasMore, error, tab, store, run]);

  function onPanelClick(e: MouseEvent<HTMLDivElement>) {
    const a = (e.target as Element).closest("a[href]");
    if (!a || a.getAttribute("target") === "_blank") return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = Math.random().toString(36).slice(2);
    writeScroll({ id, y: window.scrollY, loaded: state.current.count, href: here() });
    setHistoryMark(id);
  }

  // Header rail and store tiles drive the list.
  useEffect(() => {
    const known = (id: string) => knownTabs.includes(id);
    const offTab = on("today:tab", (id, meta) => {
      if (meta.source === self.current || !known(id)) return;
      dirty.current = true;
      setStore("");
      setTab(id);
      write(id);
    });
    const offStore = on("today:store", (slug) => {
      dirty.current = true;
      setStore(slug);
      if (slug) {
        // Own echo is excluded, so the tab handler does not clear the store again.
        setTab("all");
        write("all");
        emit("today:tab", "all", self.current);
      }
    });
    const offRefresh = on("today:refresh", () => void run("reset"));
    return () => {
      offTab();
      offStore();
      offRefresh();
    };
  }, [knownTabs, run]);

  // Auto-load the next page near the end of the list.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || fetching || error || restoring) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void run("append");
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, fetching, error, restoring, cursor, items.length, run]);

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, idx: number) {
    const last = visibleTabs.length - 1;
    let next = -1;
    if (e.key === "ArrowRight") next = idx === last ? 0 : idx + 1;
    else if (e.key === "ArrowLeft") next = idx === 0 ? last : idx - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next < 0) return;
    e.preventDefault();
    const id = visibleTabs[next].id;
    select(id);
    tabRefs.current[id]?.focus();
  }

  const visible = useMemo(() => {
    const live = now == null ? items : items.filter((i) => !i.coupon.expiresAt || Date.parse(i.coupon.expiresAt) > now);
    return sortItems(live, sort);
  }, [items, now, sort]);
  const storeName = store ? (storeNames[store] ?? store) : "";
  const empty = !fetching && !error && visible.length === 0;

  return (
    <div>
      <Suspense fallback={null}>
        <TodayUrlParams onParams={applyUrl} />
      </Suspense>
      <div className="sticky top-[calc(env(safe-area-inset-top)+var(--clipupp-hv))] z-10 -mx-4 bg-clipupp-page px-4 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:px-0">
        <div
          role="tablist"
          aria-label={t("tabsAria")}
          className="clipupp-no-scrollbar relative flex overflow-x-auto shadow-[inset_0_-1px_0_rgb(var(--clipupp-neutral-200-rgb))]"
        >
          {visibleTabs.map((x, i) => {
            const on = x.id === tab && !store;
            return (
              <button
                key={x.id}
                ref={(el) => {
                  tabRefs.current[x.id] = el;
                }}
                type="button"
                role="tab"
                id={tabId(x.id)}
                aria-selected={on}
                aria-controls={PANEL_ID}
                tabIndex={x.id === tab ? 0 : -1}
                title={x.title}
                onClick={() => select(x.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={
                  "clipupp-press relative shrink-0 whitespace-nowrap px-3 py-3 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clipupp-primary " +
                  (on ? "text-clipupp-primary" : "text-clipupp-neutral-700 hover:text-clipupp-neutral-900")
                }
              >
                {x.label}
                <span className="ml-1.5 text-[11.5px] font-normal text-clipupp-neutral-600">{x.count}</span>
              </button>
            );
          })}
          <TabInk selected={store ? null : tab} />
        </div>
      </div>

      <div className="mb-3 mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <p className="text-[14px] text-clipupp-neutral-700" aria-live="polite">
            {resetting ? t("loading") : t("count", { count: visible.length })}
          </p>
          {store && (
            <button
              type="button"
              aria-label={t("clearStore", { store: storeName })}
              onClick={() => {
                dirty.current = true;
                setStore("");
              }}
              className="clipupp-press inline-flex h-9 items-center gap-1.5 rounded-full border border-clipupp-tint-200 bg-clipupp-tint-100 pl-3.5 pr-2.5 text-[13px] font-semibold text-clipupp-primary"
            >
              {storeName}
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
        <div className="relative">
          <label htmlFor="today-sort" className="sr-only">
            {t("sortLabel")}
          </label>
          <select
            id="today-sort"
            value={effectiveSort}
            onChange={(e) => {
              dirty.current = true;
              setSort(e.target.value as Sort);
            }}
            className="h-10 appearance-none rounded-full border border-clipupp-neutral-200 bg-clipupp-surface pl-4 pr-10 text-[15px] text-clipupp-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary"
          >
            <option value="pop">{t("sortPop")}</option>
            <option value="new">{t("sortNew")}</option>
            <option value="end">{t("sortEnd")}</option>
            {showRate && <option value="rate">{t("sortRate")}</option>}
          </select>
          <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-clipupp-neutral-700" />
        </div>
      </div>

      <div
        role="tabpanel"
        id={PANEL_ID}
        aria-labelledby={tabId(store ? "all" : tab)}
        aria-busy={fetching}
        onClick={onPanelClick}
        className={`grid gap-2.5 transition-opacity sm:grid-cols-2 ${resetting ? "opacity-50" : ""}`}
      >
        {visible.map((i) => i.node)}
        {fetching &&
          [0, 1, 2, 3].map((n) => (
            <div key={`sk${n}`} aria-hidden className={`clipupp-skel h-[150px] rounded-2xl ${n > 1 ? "hidden sm:block" : ""}`} />
          ))}
      </div>

      {empty && (
        <div className="mt-2 flex flex-col items-center rounded-2xl border border-dashed border-clipupp-neutral-200 px-6 py-12 text-center">
          <Tag size={28} aria-hidden className="text-clipupp-neutral-500" />
          <p className="mt-3 text-[16px] font-semibold text-clipupp-neutral-900">{t("emptyTitle")}</p>
          <p className="mt-1 max-w-md text-[14px] text-clipupp-neutral-500">{t("emptyBody")}</p>
          {alertsOnPage && (
            <a href="#alerts" className="clipupp-btn-ghost mt-4 !min-h-10 !px-4">
              {t("emptyCta")}
            </a>
          )}
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 flex items-center gap-3 rounded-xl border border-clipupp-warning/40 bg-clipupp-warning-soft px-4 py-3 text-[14px] text-clipupp-warning-strong">
          <AlertTriangle size={18} aria-hidden />
          <span className="mr-auto">{t("loadError")}</span>
          <button
            type="button"
            onClick={() => void run(lastReq.current?.mode ?? "reset", lastReq.current ?? undefined)}
            className="clipupp-press font-semibold underline underline-offset-2"
          >
            {t("retry")}
          </button>
        </div>
      )}

      {hasMore && !error && visible.length > 0 && (
        <div className="mt-[18px] flex justify-center">
          <button
            type="button"
            onClick={() => void run("append")}
            disabled={fetching}
            className="clipupp-press inline-flex h-[46px] items-center rounded-full border border-clipupp-neutral-200 bg-clipupp-surface px-5 text-[15px] font-semibold text-clipupp-neutral-900 hover:bg-clipupp-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {t("showMore")}
          </button>
        </div>
      )}
      <div ref={sentinel} aria-hidden className="h-px" />
    </div>
  );
}
