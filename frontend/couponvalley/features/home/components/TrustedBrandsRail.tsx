import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { ScrollRail } from "@/components/site/ScrollRail";
import { storesApi } from "@/lib/api/stores";
import type { HomepageSectionPayload } from "@/lib/api/homepage";

type Store = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  brandColor?: string | null;
};

/**
 * "Explore online promo codes from brands you trust" — white logo tiles in a
 * horizontally scrolling rail with edge-fade masking. Server-rendered HTML;
 * arrow buttons + pagination dots hydrate as a small client island
 * (ScrollRail with `showDots`). CSS scroll-snap makes the rail usable without
 * JS. The edge fade is a CSS mask-image, so it costs nothing in JS.
 */
export async function TrustedBrandsRail({
  section,
}: {
  section?: HomepageSectionPayload | null;
}) {
  const heading =
    section?.title ?? "Explore online promo codes from brands you trust";
  const limit = section?.itemLimit ?? 12;
  const preloaded = (section?.stores as Store[] | null | undefined) ?? null;

  const stores: Store[] = (preloaded ?? (await safeFetch(limit))).slice(0, limit);

  return (
    <section aria-labelledby="trusted-brands-heading">
      <div className="mb-6">
        <p className="cv-eyebrow-vivid">Brands you know</p>
        <h2 id="trusted-brands-heading" className="cv-h2 mt-2">
          {heading}
        </h2>
      </div>

      <div
        className="mt-6"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%)",
        }}
      >
        {stores.length === 0 ? (
          <p className="cv-meta">No brands yet.</p>
        ) : (
          <ScrollRail
            ariaLabel="Trusted brands"
            variant="arrow"
            showDots
            className="gap-3"
          >
            {stores.map((s) => (
              <BrandCard key={s.id} store={s} />
            ))}
          </ScrollRail>
        )}
      </div>
    </section>
  );
}

async function safeFetch(limit: number): Promise<Store[]> {
  try {
    const page = await storesApi.list({ limit });
    return (page.data ?? []) as Store[];
  } catch {
    return [];
  }
}

function BrandCard({ store }: { store: Store }) {
  const initial = (store.name || "?").trim().charAt(0).toUpperCase();
  const hasLogo = Boolean(store.logoUrl);
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="cv-card flex h-[110px] w-[calc((100%-3rem)/2)] shrink-0 snap-start items-center justify-center overflow-hidden p-4 sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/6)]"
      aria-label={store.name}
    >
      {hasLogo ? (
        <Image
          src={store.logoUrl}
          alt={store.name}
          width={188}
          height={72}
          sizes="(min-width: 1024px) 188px, (min-width: 640px) 33vw, 50vw"
          className="max-h-full w-auto max-w-full object-contain transition-transform group-hover:scale-105"
        />
      ) : (
        <span
          aria-hidden
          className="grid h-14 w-14 place-items-center rounded-full bg-cv-primary-soft text-cv-primary text-xl font-extrabold"
        >
          {initial}
        </span>
      )}
    </Link>
  );
}
