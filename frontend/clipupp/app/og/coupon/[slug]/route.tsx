import { ImageResponse } from "next/og";
import { couponsApi } from "@/lib/api/coupons";
import { isApiError } from "@/lib/api/errors";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

/**
 * Mirror of the --cv-* CSS variables in app/globals.css. Edge runtime
 * cannot read CSS variables, so OG image generation needs literal hex.
 * Keep in sync with globals.css when the brand palette changes.
 */
const CV = {
  primary:       "#6D28D9",
  primaryStrong: "#5B21B6",
} as const;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  let title = "Save with Clipupp";
  let store = "";
  let savings: string | null = null;
  let logoUrl: string | null = null;
  try {
    const coupon = await couponsApi.bySlug(slug);
    title = coupon.title;
    savings = coupon.savingsLabel;
    store = coupon.store?.name ?? "";
    logoUrl = coupon.store?.logoUrl ?? null;
  } catch (err) {
    if (!(isApiError(err) && err.status === 404)) {
      // generic fallback
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
          background: `linear-gradient(135deg, ${CV.primary} 0%, ${CV.primaryStrong} 100%)`,
          color: "white",
          fontFamily: "ui-sans-serif, system-ui, -apple-system",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              width={96}
              height={96}
              style={{
                borderRadius: 20,
                background: "white",
                padding: 14,
                objectFit: "contain",
              }}
              alt=""
            />
          ) : (
            <div style={{ width: 96, height: 96, borderRadius: 20, background: "rgba(255,255,255,0.1)" }} />
          )}
          <span style={{ fontSize: 28, opacity: 0.85 }}>{store || "Clipupp"}</span>
        </div>
        {savings && (
          <div
            style={{
              alignSelf: "flex-start",
              padding: "16px 28px",
              background: "white",
              color: CV.primary,
              borderRadius: 16,
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            {savings}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 1040,
            }}
          >
            {title.length > 90 ? title.slice(0, 87) + "…" : title}
          </span>
          <span style={{ fontSize: 28, opacity: 0.7 }}>
            clipupp.com — verified coupons
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
