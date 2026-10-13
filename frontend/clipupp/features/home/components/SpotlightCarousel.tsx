"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import type { FeedCoupon, FeedSpotlight, FeedStore } from "@/lib/home/feed";
import { useCouponSheet } from "@/lib/home/useCouponSheet";
import { wrapNumbers } from "@/lib/format/wrapNumbers";
import { StoreTile } from "@/features/catalog/components/StoreTile";
import { cn } from "@/lib/utils";

const AUTO_MS = 5000;

function endLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

function fallbackStore(slug: string): FeedStore {
  return {
    id: slug, name: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "), logo: null, mono: slug.slice(0, 2).toUpperCase(), bg: "var(--clipupp-logo-bg)", fg: "var(--clipupp-deep)",
    cat: null, url: null, coupons: 0, best: null, popular: null,
  };
}

/**
 * Spotlight carousel: native scroll-snap rail (88% / 70% slides below lg, one
 * full-width slide at lg+) with dots, arrows (lg+) and a 5s auto-advance that
 * stops for good after any user interaction, while hovered, when the tab is
 * hidden and under reduced motion. The active index follows the scroll position.
 */
export function SpotlightCarousel({
  slides,
  stores,
  coupons,
}: {
  slides: FeedSpotlight[];
  stores: FeedStore[];
  coupons: FeedCoupon[];
}) {
  const t = useTranslations("home.spotlight");
  const openSheet = useCouponSheet((s) => s.open);
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const interacted = useRef(false);
  const hovered = useRef(false);
  const n = slides.length;

  const slideEls = () => Array.from(railRef.current?.children ?? []) as HTMLElement[];

  const goTo = useCallback((i: number) => {
    const rail = railRef.current;
    const el = slideEls()[i];
    if (!rail || !el) return;
    const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({ left: el.offsetLeft - pad, behavior: reduce ? "auto" : "smooth" });
  }, []);

  // Active index follows scroll (rAF throttled).
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
      let best = 0;
      let bestD = Infinity;
      slideEls().forEach((el, i) => {
        const d = Math.abs(el.offsetLeft - pad - rail.scrollLeft);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      activeRef.current = best;
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [n]);

  // Auto-advance.
  useEffect(() => {
    if (n < 2) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const id = window.setInterval(() => {
      if (interacted.current || hovered.current || document.hidden || mq.matches) return;
      goTo((activeRef.current + 1) % n);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [n, goTo]);

  if (n === 0) return null;

  const mark = () => {
    interacted.current = true;
  };
  const step = (dir: 1 | -1) => {
    mark();
    goTo((activeRef.current + dir + n) % n);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("label")}
      className="min-w-0"
      onTouchStart={mark}
      onPointerDown={mark}
      onFocus={mark}
    >
      <div
        ref={railRef}
        onMouseEnter={() => (hovered.current = true)}
        onMouseLeave={() => (hovered.current = false)}
        className="clipupp-no-scrollbar relative -mx-4 flex scroll-pl-4 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-5 pt-1 sm:-mx-6 sm:scroll-pl-6 sm:px-6 lg:mx-0 lg:scroll-pl-0 lg:gap-0 lg:px-0"
      >
        {slides.map((s, i) => {
          const store = stores.find((x) => x.id === s.store) ?? fallbackStore(s.store);
          const coupon = s.couponId ? coupons.find((c) => c.id === s.couponId) : undefined;
          const till = endLabel(s.endsAt);
          return (
            <div
              key={`${s.store}-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={t("slide", { i: i + 1, n })}
              className="flex min-h-[360px] shrink-0 basis-[88%] snap-start flex-col rounded-[22px] p-6 text-white [scroll-snap-stop:always] sm:basis-[70%] lg:basis-full lg:p-7"
              style={{
                background:
                  "radial-gradient(420px 240px at 100% 0%, rgb(255 255 255 / 0.16), transparent 70%), radial-gradient(380px 260px at 0% 110%, rgb(var(--clipupp-primary-rgb) / 0.35), transparent 70%), linear-gradient(160deg, var(--clipupp-deep), var(--clipupp-deep-2))",
                boxShadow: "0 8px 20px rgba(42,15,82,.2)",
              }}
            >
              <div className="flex items-center gap-3">
                <StoreTile store={store} size={44} className="!rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold leading-tight">{store.name}</div>
                  <div className="truncate text-[12.5px] text-white/70">{s.kicker}</div>
                </div>
                {s.flag && (
                  <span className="shrink-0 rounded-full bg-clipupp-gold px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-clipupp-deep">
                    {s.flag === "Live now" ? t("liveNow") : s.flag}
                  </span>
                )}
              </div>
              <h3 className="mt-5 font-display text-[26px] font-bold leading-[1.1] tracking-[-0.01em] text-white [text-wrap:balance] lg:text-[36px]">
                {wrapNumbers(s.title)}
              </h3>
              <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.5] text-white/80">{s.text}</p>
              {s.perks.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {s.perks.map((p) => (
                    <li key={p} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] text-white/90">
                      {p}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-6">
                {coupon ? (
                  <button
                    type="button"
                    onClick={() => {
                      // Copy inside the click gesture; the sheet reports the outcome.
                      let copy: Promise<void> | null = null;
                      try {
                        if (coupon.code) {
                          copy = navigator.clipboard?.writeText(coupon.code.trim()) ?? null;
                          copy?.catch(() => {});
                        }
                      } catch {}
                      openSheet(coupon, store, null, { copy });
                    }}
                    className="h-[46px] rounded-full bg-white px-6 text-[15px] font-semibold text-clipupp-deep transition active:scale-[0.97] hover:bg-white/90"
                  >
                    {t("cta")}
                  </button>
                ) : (
                  <Link
                    href={`/stores/${s.store}`}
                    className="inline-flex h-[46px] items-center rounded-full bg-white px-6 text-[15px] font-semibold text-clipupp-deep transition active:scale-[0.97] hover:bg-white/90"
                  >
                    {t("cta")}
                  </Link>
                )}
                {till && <span className="text-[13.5px] text-white/70">{t("till", { date: till })}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="-mt-1 flex items-center justify-between">
        <div role="tablist" className="flex items-center gap-1.5">
          {slides.map((s, i) => {
            const name = (stores.find((x) => x.id === s.store) ?? fallbackStore(s.store)).name;
            return (
              <button
                key={`${s.store}-${i}`}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={t("dot", { store: name })}
                onClick={() => {
                  mark();
                  goTo(i);
                }}
                className="group grid h-6 w-6 place-items-center"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-colors duration-300",
                    i === active ? "w-[22px] bg-clipupp-primary" : "w-1.5 bg-clipupp-primary/25",
                  )}
                />
              </button>
            );
          })}
        </div>
        {n > 1 && (
          <div className="hidden gap-2 lg:flex">
            <button
              type="button"
              aria-label={t("prev")}
              onClick={() => step(-1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-clipupp-neutral-200 bg-clipupp-surface text-clipupp-neutral-900 transition hover:border-clipupp-primary active:scale-[0.92]"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t("next")}
              onClick={() => step(1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-clipupp-neutral-200 bg-clipupp-surface text-clipupp-neutral-900 transition hover:border-clipupp-primary active:scale-[0.92]"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
