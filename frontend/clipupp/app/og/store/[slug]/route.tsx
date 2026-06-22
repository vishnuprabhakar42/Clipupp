import { ImageResponse } from "next/og";
import { storesApi } from "@/lib/api/stores";
import { isApiError } from "@/lib/api/errors";

// Edge runtime for fast OG generation at the edge.
export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

/**
 * Mirror of the --cv-* CSS variables in app/globals.css. Edge runtime
 * cannot read CSS variables (no DOM, no stylesheets), so the OG generator
 * needs literal hex values. Keep this in sync with globals.css when the
 * brand palette changes.
 */
const CV = {
  primary:       "#8529CD",
  primaryStrong: "#7119B8",
  accent:        "#8529CD",
} as const;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  let title = "Clipupp";
  let subtitle = "Verified coupons & exclusive deals";
  let logoUrl: string | null = null;
  try {
    const store = await storesApi.bySlug(slug);
    title = store.name;
    subtitle = store.shortDescription ?? "Verified coupon codes & deals";
    logoUrl = store.logoUrl;
  } catch (err) {
    if (!(isApiError(err) && err.status === 404)) {
      // Fall through to the generic card.
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: `linear-gradient(135deg, ${CV.primary} 0%, ${CV.primaryStrong} 60%, #9B50D6 100%)`,
          color: "white",
          fontFamily: "ui-sans-serif, system-ui, -apple-system",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              width={120}
              height={120}
              style={{
                borderRadius: 24,
                background: "white",
                padding: 16,
                objectFit: "contain",
              }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 24,
                background: "rgba(255,255,255,0.1)",
              }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 28, opacity: 0.85 }}>Clipupp</span>
            <span style={{ fontSize: 24, opacity: 0.7, marginTop: 4 }}>
              Verified store
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span
            style={{
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.5,
            }}
          >
            {title}
          </span>
          <span style={{ fontSize: 32, opacity: 0.85, lineHeight: 1.3, maxWidth: 1000 }}>
            {subtitle.length > 110 ? subtitle.slice(0, 107) + "…" : subtitle}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
