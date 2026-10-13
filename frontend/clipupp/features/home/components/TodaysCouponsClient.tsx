"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AlertTriangle, ChevronDown, Tag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { loadTodayCoupons } from "../actions/todayCoupons";
import { emit, on, peek } from "@/lib/home/homeBus";
import type { RowItem } from "../lib/todayRows";
import { sortItems, type Sort } from "../lib/todaySort";
import { applyPage, safeLoad } from "../lib/todayState";

type Req = { mode: "reset" | "append"; tab: string; store: string; cursor: string | null; startIndex: number };

type Tab = { id: string; label: string; title: string; count: number };

const STORAGE_KEY = "clipupp:tab";
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

export function TodaysCouponsClient({
  tabs,
  total,
  initial,
  initialCursor,
  storeNames,
  pageSize,
}: {
  tabs: Tab[];
  total: number;
  initial: RowItem[];
  /** Cursor after the server-rendered first page; null when the list is complete. */
  initialCursor: string | null;
  storeNames: Record<string, string>;
  pageSize: number;
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
    setStore("");
    setTab(id);
    write(id);
    if (notify) emit("today:tab", id, self.current);
  }, []);

  // Header rail and store tiles drive the list; restore the saved tab.
  useEffect(() => {
    const known = (id: string) => id === "all" || tabs.some((x) => x.id === id);
    const fromBus = peek("today:tab");
    const saved = fromBus ?? read();
    if (saved && saved !== "all" && known(saved)) {
      setTab(saved);
      if (!fromBus) emit("today:tab", saved, self.current);
    }
    const offTab = on("today:tab", (id, meta) => {
      if (meta.source === self.current || !known(id)) return;
      setStore("");
      setTab(id);
      write(id);
    });
    const offStore = on("today:store", (slug) => {
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
  }, [tabs, run]);

  // Auto-load the next page near the end of the list.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || fetching || error) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void run("append");
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, fetching, error, cursor, items.length, run]);

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

  const showRate = items.some((i) => i.coupon.success != null);
  const visible = useMemo(() => {
    const live = now == null ? items : items.filter((i) => !i.coupon.expiresAt || Date.parse(i.coupon.expiresAt) > now);
    return sortItems(live, sort);
  }, [items, now, sort]);
  const effectiveSort: Sort = sort === "rate" && !showRate ? "pop" : sort;
  const storeName = store ? (storeNames[store] ?? store) : "";
  const empty = !fetching && !error && visible.length === 0;

  return (
    <div>
      <div className="sticky top-[calc(env(safe-area-inset-top)+var(--clipupp-hv))] z-10 -mx-4 bg-clipupp-page px-4 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:px-0">
        <div
          role="tablist"
          aria-label={t("tabsAria")}
          className="clipupp-no-scrollbar flex overflow-x-auto border-b border-clipupp-neutral-200"
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
                  "relative shrink-0 whitespace-nowrap px-3 py-3 text-[15px] font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:rounded-t after:transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clipupp-primary " +
                  (on
                    ? "text-clipupp-primary after:bg-clipupp-primary after:opacity-100"
                    : "text-clipupp-neutral-700 after:opacity-0 hover:text-clipupp-neutral-900")
                }
              >
                {x.label}
                <span className="ml-1.5 text-[11.5px] font-normal text-clipupp-neutral-500">{x.count}</span>
              </button>
            );
          })}
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
              onClick={() => setStore("")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-clipupp-tint-200 bg-clipupp-tint-100 pl-3.5 pr-2.5 text-[13px] font-semibold text-clipupp-primary"
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
            onChange={(e) => setSort(e.target.value as Sort)}
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
          <a href="#alerts" className="clipupp-btn-ghost mt-4 !min-h-10 !px-4">
            {t("emptyCta")}
          </a>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 flex items-center gap-3 rounded-xl border border-clipupp-warning/40 bg-clipupp-warning-soft px-4 py-3 text-[14px] text-clipupp-warning-strong">
          <AlertTriangle size={18} aria-hidden />
          <span className="mr-auto">{t("loadError")}</span>
          <button
            type="button"
            onClick={() => void run(lastReq.current?.mode ?? "reset", lastReq.current ?? undefined)}
            className="font-semibold underline underline-offset-2"
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
            className="inline-flex h-[46px] items-center rounded-full border border-clipupp-neutral-200 bg-clipupp-surface px-5 text-[15px] font-semibold text-clipupp-neutral-900 transition-colors hover:bg-clipupp-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary focus-visible:ring-offset-2 motion-safe:active:scale-[0.97] disabled:opacity-60"
          >
            {t("showMore")}
          </button>
        </div>
      )}
      <div ref={sentinel} aria-hidden className="h-px" />
    </div>
  );
}
