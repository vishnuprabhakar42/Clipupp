import { monogramInk } from "@/lib/format/contrast";
import type { FeedStore } from "@/lib/home/feed";
import { LogoImage } from "./LogoImage";

/** Square store logo, or a monogram tile built from the store's colours. */
export function StoreTile({ store, size = 44, className = "" }: { store: FeedStore; size?: number; className?: string }) {
  const style = { width: size, height: size } as const;
  const { ink, lowContrast } = monogramInk(store.bg, store.fg);
  const mono = (
    <span
      aria-hidden
      data-a11y-exception={lowContrast ? "" : undefined}
      className={"grid shrink-0 place-items-center rounded-xl font-bold tracking-tight " + className}
      style={{ ...style, background: store.bg, color: ink, fontSize: Math.round(size * 0.34) }}
    >
      {store.mono}
    </span>
  );
  if (!store.logo) return mono;
  return (
    <LogoImage
      src={store.logo}
      width={size}
      height={size}
      sizes={`${size}px`}
      className="h-full w-full object-contain"
      frameClassName={"grid shrink-0 place-items-center overflow-hidden rounded-xl border border-clipupp-neutral-200 bg-clipupp-logo-bg p-1 " + className}
      frameStyle={style}
      fallback={mono}
    />
  );
}
