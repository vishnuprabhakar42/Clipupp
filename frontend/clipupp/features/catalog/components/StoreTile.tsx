import Image from "next/image";
import type { FeedStore } from "@/lib/home/feed";

/** Square store logo, or a monogram tile built from the store's colours. */
export function StoreTile({ store, size = 44, className = "" }: { store: FeedStore; size?: number; className?: string }) {
  const style = { width: size, height: size } as const;
  if (store.logo) {
    return (
      <span
        className={"grid shrink-0 place-items-center overflow-hidden rounded-xl border border-clipupp-neutral-200 bg-white p-1 " + className}
        style={style}
      >
        <Image src={store.logo} alt="" width={size} height={size} className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={"grid shrink-0 place-items-center rounded-xl font-bold tracking-tight " + className}
      style={{ ...style, background: store.bg, color: store.fg, fontSize: Math.round(size * 0.34) }}
    >
      {store.mono}
    </span>
  );
}
