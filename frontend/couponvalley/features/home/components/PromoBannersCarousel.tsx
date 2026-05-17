"use client";

import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { bannersApi, type BannerDetail } from "@/lib/api/banners";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

/**
 * Promo banner carousel — Rakuten-style desktop layout:
 *
 *   [ peek 15% ] [ main banner ~70% ] [ peek 15% ]
 *
 * Implemented as a CSS Grid (`grid-cols-[15%_1fr_15%]`) so the column widths
 * are guaranteed regardless of content. Inline SVG illustrations + CSS
 * gradients → zero external image fetches → LCP-safe, no CLS, crawler-
 * friendly (all copy is real DOM, not text-in-SVG).
 */

type SlideTheme = {
  bg: string;
  text: string;
  muted: string;
  ctaBg: string;
  ctaText: string;
  illustration: () => ReactNode;
};

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  cta: string;
  imageUrl: string; // GIF / JPG / PNG / WebP — anything <img> can render
  theme: SlideTheme;
};

/* ─────────────────────────────  Illustrations  ─────────────────────────── */

const FloralBloom = memo(function FloralBloom() {
  const petal = (cx: number, cy: number, scale: number, opacity: number) => (
    <g
      key={`${cx}-${cy}`}
      transform={`translate(${cx} ${cy}) scale(${scale})`}
      opacity={opacity}
    >
      <path
        d="M0,-22 C12,-22 18,-12 12,-2 C22,-6 22,8 12,12 C18,22 6,28 -2,18 C-6,28 -18,22 -14,12 C-22,8 -22,-6 -14,-2 C-18,-12 -12,-22 0,-22 Z"
        fill="#D14545"
      />
      <circle r="6" fill="#5A1212" />
    </g>
  );
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 280"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {petal(720, 60, 1.1, 0.92)}
      {petal(770, 220, 0.95, 0.82)}
      {petal(660, 260, 0.7, 0.55)}
      {petal(610, 110, 0.7, 0.6)}
      {petal(680, 170, 0.55, 0.4)}
      {petal(540, 40, 0.55, 0.35)}
      {petal(560, 280, 0.5, 0.3)}
    </svg>
  );
});

const PurpleConfetti = memo(function PurpleConfetti() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 280"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id="pc-spot" cx="78%" cy="40%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx="680" cy="120" r="220" fill="url(#pc-spot)" />
      {[
        [710, 100, 36],
        [620, 260, 26],
        [580, 110, 18],
        [760, 230, 22],
        [600, 50, 14],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.18)" />
          <circle cx={cx} cy={cy} r={r - 8} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
        </g>
      ))}
      {[
        [100, 80, -20],
        [160, 270, 30],
        [240, 130, 15],
        [420, 280, -25],
        [500, 70, 25],
        [340, 50, -10],
      ].map(([x, y, rot], i) => (
        <rect
          key={`c-${i}`}
          x={x}
          y={y}
          width="16"
          height="4"
          rx="2"
          fill="rgba(255,255,255,0.55)"
          transform={`rotate(${rot} ${x + 8} ${y + 2})`}
        />
      ))}
    </svg>
  );
});

const Sparkles = memo(function Sparkles() {
  const star = (cx: number, cy: number, s: number, op: number) => (
    <path
      key={`${cx}-${cy}`}
      d={`M${cx},${cy - 10 * s} L${cx + 2.4 * s},${cy - 2.4 * s} L${cx + 10 * s},${cy} L${cx + 2.4 * s},${cy + 2.4 * s} L${cx},${cy + 10 * s} L${cx - 2.4 * s},${cy + 2.4 * s} L${cx - 10 * s},${cy} L${cx - 2.4 * s},${cy - 2.4 * s} Z`}
      fill="rgba(255,255,255,0.9)"
      opacity={op}
    />
  );
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 280"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id="sp-spot" cx="80%" cy="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <ellipse cx="640" cy="160" rx="240" ry="160" fill="url(#sp-spot)" />
      {star(680, 90, 1.6, 0.95)}
      {star(740, 220, 1.1, 0.88)}
      {star(600, 170, 1.8, 0.85)}
      {star(560, 70, 0.8, 0.65)}
      {star(640, 270, 0.9, 0.75)}
      {star(440, 60, 0.7, 0.55)}
      {star(380, 270, 0.6, 0.45)}
    </svg>
  );
});

const TravelClouds = memo(function TravelClouds() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 280"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id="sun" cx="78%" cy="38%">
          <stop offset="0%" stopColor="rgba(255,215,150,0.85)" />
          <stop offset="60%" stopColor="rgba(255,175,105,0.22)" />
          <stop offset="100%" stopColor="rgba(255,175,105,0)" />
        </radialGradient>
      </defs>
      <circle cx="620" cy="120" r="200" fill="url(#sun)" />
      {[
        [120, 90, 1.1],
        [260, 250, 0.85],
        [420, 80, 0.7],
        [540, 270, 0.95],
        [720, 240, 0.9],
      ].map(([cx, cy, s], i) => (
        <g key={i} transform={`translate(${cx} ${cy}) scale(${s})`} opacity="0.6">
          <ellipse rx="44" ry="15" fill="rgba(255,255,255,0.92)" />
          <ellipse cx="-24" cy="-7" rx="22" ry="12" fill="rgba(255,255,255,0.92)" />
          <ellipse cx="24" cy="-5" rx="24" ry="13" fill="rgba(255,255,255,0.92)" />
        </g>
      ))}
      <g transform="translate(600 180) rotate(-12)" opacity="0.94">
        <path
          d="M-46,0 L24,-4 L58,-16 L67,-14 L60,0 L67,14 L58,16 L24,4 L-46,0 Z M-46,0 L-34,-7 L-25,-7 L-30,0 L-25,7 L-34,7 Z"
          fill="rgba(255,255,255,0.97)"
        />
      </g>
    </svg>
  );
});

/* ──────────────────────────  Theme catalogue  ──────────────────────────── */

const THEMES: SlideTheme[] = [
  {
    // Lavender Bloom — soft violet tones, elegant light background
    bg: "linear-gradient(120deg, #EDE9FE 0%, #DDD6FE 50%, #C4B5FD 100%)",
    text: "#1a0d20",
    muted: "rgba(26,13,32,0.72)",
    ctaBg: "#4C1D95",
    ctaText: "#ffffff",
    illustration: () => <FloralBloom />,
  },
  {
    // Deep Violet — bold, brand-primary dark gradient
    bg: "linear-gradient(120deg, #2E1065 0%, #4C1D95 50%, #5B21B6 100%)",
    text: "#ffffff",
    muted: "rgba(255,255,255,0.85)",
    ctaBg: "#ffffff",
    ctaText: "#4C1D95",
    illustration: () => <PurpleConfetti />,
  },
  {
    // Emerald Sparkles — keep: green = money = savings
    bg: "linear-gradient(120deg, #064E3B 0%, #047857 45%, #10B981 100%)",
    text: "#ffffff",
    muted: "rgba(255,255,255,0.88)",
    ctaBg: "#ffffff",
    ctaText: "#064e3b",
    illustration: () => <Sparkles />,
  },
  {
    // Flame Orange — blazing urgency, screams "hot deal"
    bg: "linear-gradient(120deg, #431407 0%, #EA580C 45%, #F97316 100%)",
    text: "#ffffff",
    muted: "rgba(255,255,255,0.9)",
    ctaBg: "#ffffff",
    ctaText: "#431407",
    illustration: () => <TravelClouds />,
  },
];


/* ──────────────────────────────  Component  ────────────────────────────── */

export function PromoBannersCarousel({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  section,
}: { section?: HomepageSectionPayload | null } = {}) {
  // Pull every active banner from /admin/banners (any placement). The admin
  // list is the single source of truth: whatever is active and live there
  // shows up here in the carousel.
  const q = useQuery({
    queryKey: ["banners", "all"],
    queryFn: () => bannersApi.list(),
    staleTime: 5 * 60_000,
  });

  const slides = buildSlides(q.data ?? []);
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (total > 0 && index >= total) setIndex(0);
  }, [total, index]);

  useEffect(() => {
    if (total < 2 || paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 2) % total);
    }, 6500);
    const onVis = () => {
      if (document.hidden) window.clearInterval(t);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [total, paused]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex((i) => (i - 2 + total) % total);
      if (e.key === "ArrowRight") setIndex((i) => (i + 2) % total);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [total]);

  if (q.isLoading) {
    return (
      <div className="pt-6 md:pt-8">
        <div className="hidden grid-cols-2 gap-4 md:grid">
          <div className="cv-skeleton rounded-md" style={{ height: 280 }} />
          <div className="cv-skeleton rounded-md" style={{ height: 280 }} />
        </div>
        <div className="cv-skeleton h-[220px] rounded-md md:hidden" />
      </div>
    );
  }

  if (total === 0) return null;

  // Build pages of 2 banners each. The last page wraps back to the start
  // when total is odd so each page is always full.
  const pages: Array<[Slide, Slide]> = [];
  for (let i = 0; i < total; i += 2) {
    pages.push([slides[i], slides[(i + 1) % total]]);
  }
  const pageCount = pages.length;
  const currentPageIndex = Math.min(Math.floor(index / 2), pageCount - 1);

  const goPrev = () => setIndex((i) => (i - 2 + total) % total);
  const goNext = () => setIndex((i) => (i + 2) % total);

  const currentPage = currentPageIndex + 1;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      tabIndex={0}
      ref={containerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative pt-6 outline-none focus-visible:ring-2 focus-visible:ring-cv-primary/40 md:pt-8"
    >
      {/* ──────────────  Desktop: sliding track of page pairs  ────────────── */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Viewport (clips overflow) */}
          <div className="overflow-hidden">
            {/* Track: one cell per page; the whole track slides */}
            <div
              className="flex will-change-transform"
              style={{
                width: `${pageCount * 100}%`,
                transform: `translate3d(-${currentPageIndex * (100 / pageCount)}%, 0, 0)`,
                transition: "transform 600ms cubic-bezier(.22,.96,.36,1)",
              }}
            >
              {pages.map(([a, b], pi) => (
                <div
                  key={pi}
                  className="grid shrink-0 items-stretch gap-4"
                  style={{
                    width: `${100 / pageCount}%`,
                    gridTemplateColumns: "1fr 1fr",
                  }}
                >
                  <MainBanner slide={a} keySeed={`${a.id}-${pi}-a`} />
                  <MainBanner slide={b} keySeed={`${b.id}-${pi}-b`} />
                </div>
              ))}
            </div>
          </div>

          {pageCount > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous banners"
                onClick={goPrev}
                className="absolute z-20 grid h-7 w-7 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition hover:scale-110 hover:text-gray-900"
                style={{ left: 0, top: "50%", transform: "translate(-50%, -50%)" }}
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                aria-label="Next banners"
                onClick={goNext}
                className="absolute z-20 grid h-7 w-7 place-items-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition hover:scale-110 hover:text-gray-900"
                style={{ right: 0, top: "50%", transform: "translate(50%, -50%)" }}
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>

        {pageCount > 1 && (
          <p
            className="mt-2 text-[11px] tabular-nums text-cv-neutral-500"
            aria-live="polite"
          >
            <span className="font-semibold text-gray-900">{currentPage}</span>
            <span className="mx-0.5">/</span>
            <span>{pageCount}</span>
          </p>
        )}
      </div>

      {/* ──────────────  Mobile: snap-x rail  ────────────── */}
      <div className="md:hidden">
        <div className="cv-no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1">
          {slides.map((s) => (
            <MainBanner key={s.id} slide={s} keySeed={s.id} mobile />
          ))}
        </div>
      </div>

    </section>
  );
}

/* ────────────────────────────  Subcomponents  ──────────────────────────── */

function MainBanner({
  slide,
  keySeed,
  mobile = false,
}: {
  slide: Slide;
  keySeed: string;
  mobile?: boolean;
}) {
  const Illustration = slide.theme.illustration;
  const cls = mobile
    ? "group relative block w-[88%] shrink-0 snap-start overflow-hidden rounded-md shadow-sm ring-1 ring-black/5"
    : "group relative block overflow-hidden rounded-md ring-1 ring-black/5 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),0_2px_4px_-1px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_8px_20px_-2px_rgba(0,0,0,0.12),0_4px_8px_-2px_rgba(0,0,0,0.06)]";
  return (
    <Link
      key={keySeed}
      href={slide.linkUrl}
      className={cls}
      style={{ background: slide.theme.bg, height: mobile ? 220 : 280 }}
    >
      {slide.imageUrl ? (
        <BannerMedia
          src={slide.imageUrl}
          alt={slide.title}
          eager={!mobile}
          fallback={<Illustration />}
        />
      ) : (
        <Illustration />
      )}
      <span className="sr-only">{slide.title}</span>
    </Link>
  );
}

/* ─────────────────────────────  Media tile  ────────────────────────────── */

/**
 * Banner image — renders a plain `<img>` so animated GIFs/WebP work without
 * any special pipeline. `object-cover` fills the fixed-height card with no
 * CLS. If the URL 404s or fails to decode, swaps to the inline SVG fallback
 * so the carousel never shows a broken-image icon.
 */
function BannerMedia({
  src,
  alt,
  eager,
  fallback,
}: {
  src: string;
  alt: string;
  eager: boolean;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

/* ───────────────────────────  Slide builder  ───────────────────────────── */

/**
 * Convert the API rows into render-ready slides. Banner copy, link, and
 * image URL all come from the database (`/admin/banners`). We only attach
 * a theme by slot index so the SVG error-fallback has a sensible gradient
 * to show if an image URL ever 404s — the theme isn't otherwise visible.
 */
function buildSlides(api: BannerDetail[]): Slide[] {
  return api.map((b, i) => ({
    id: b.id,
    eyebrow: "",
    title: b.title,
    subtitle: b.subtitle ?? "",
    linkUrl: b.linkUrl,
    cta: "",
    imageUrl: b.imageUrl,
    theme: THEMES[i % THEMES.length],
  }));
}
